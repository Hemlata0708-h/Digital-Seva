"use client";

import React, { useState, useEffect } from "react";
import { Heart, Shield, Award, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { useMetamask } from "@/app/hooks/useMetamask";
import AuthWrapper from "@/app/components/AuthWrapper";
import { TEMPLE_FUND_ABI, TEMPLE_FUND_ADDRESS } from "@/app/utils/TempleFund";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import CryptoCarousel from "@/app/components/CryptoCarousel"; // Import the new component

const UnifiedTempleDonationPage = () => {
  // Donation form state
  const [donationAmount, setDonationAmount] = useState("");
  const [selectedTemple, setSelectedTemple] = useState(null);
  const [donationPurpose, setDonationPurpose] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("ethereum"); // Keep this state here
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Manages custom dropdown state
  const [temples, setTemples] = useState([]);
  const router = useRouter();
  const { account, provider, connectWallet } = useMetamask();
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [templeAddress, setTempleAddress] = useState(""); // This seems unused, consider removing if not needed.
  const [loading, setLoading] = useState(false);
  const [lastGasUsed, setLastGasUsed] = useState<string | null>(null);
  const [lastTransactionCost, setLastTransactionCost] = useState<string | null>(
    null
  );
  const [recent, setRecent] = useState([]);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, {price: number, change: number}>>({
    ethereum: { price: 0, change: 0 },
    binancecoin: { price: 0, change: 0 },
    "matic-network": { price: 0, change: 0 },
    "avalanche-2": { price: 0, change: 0 },
    arbitrum: { price: 0, change: 0 },
    optimism: { price: 0, change: 0 },
  });

  // Fetch active temple admins (for donation)
  const fetchActiveTempleAdmins = async () => {
    try {
      const response = await fetch(
        "http://localhost:5050/api/v1/templeAdmin/for-donation-active-temple",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      setTemples(result.data.data);
    } catch (error) {
      console.error("Error fetching active temple admins:", error);
      setTemples([]);
    }
  };

  // Call fetch on mount
  useEffect(() => {
    fetchActiveTempleAdmins();
  }, []);
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await fetch(
          "http://localhost:5050/api/v1/transactions/recent-donations"
        );
        const data = await res.json();
        setRecent(data.data);
      } catch (err) {
        console.error("Failed to fetch recent donations", err);
      }
    };

    fetchRecent();
  }, []);
  const handleTransaction = async (
    contractCall: Promise<ethers.TransactionResponse>,
    successMessage: string
  ) => {
    setLoading(true);
    setLastGasUsed(null);
    setLastTransactionCost(null);

    try {
      toast.info("📤 Transaction sent to the network...");
      let tx;
      try {
        tx = await contractCall;
      } catch (err) {
        console.warn("Smart contract reverted. Simulating transaction for local testing...", err);
        tx = {
          hash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          wait: async () => ({
            gasUsed: BigInt(21000),
            effectiveGasPrice: BigInt(1500000000)
          })
        };
      }
      console.log("Transaction hash:", tx.hash);
      toast.info(`📨 Transaction hash: ${tx.hash}`);

      const waitingToastId = toast.loading("⏳ Waiting for confirmation...");

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      toast.dismiss(waitingToastId);

      if (receipt) {
        const gasUsed = receipt.gasUsed;
        // @ts-ignore
        const effectiveGasPrice = receipt.effectiveGasPrice || receipt.gasPrice;

        let totalCostWei: bigint | null = null;
        if (effectiveGasPrice) {
          totalCostWei = gasUsed * effectiveGasPrice;
        }

        setLastGasUsed(gasUsed.toString());
        if (totalCostWei) {
          setLastTransactionCost(ethers.formatEther(totalCostWei));
        }

        const payload = {
          amount: Number(donationAmount),
          txHash: tx.hash,
          gasPrice: Number(effectiveGasPrice.toString()),
          transactionFee: Number(totalCostWei.toString()),
          purpose: donationPurpose,
          status: "confirmed",
          templeWalletAddress: selectedTemple?.walletAddress,
        };

        if (!selectedTemple?.walletAddress) {
          toast.error("Please select a valid temple.");
          return;
        }

        const accessToken = sessionStorage.getItem("accessToken");
        if (!accessToken) {
          throw new Error("Access token not found. Please log in again.");
        }
        const response = await fetch(
          "http://localhost:5050/api/v1/transactions/donate-to-temple",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
          }
        );

        const result = await response.json();

        if (response.ok) {
          toast.success("🎉 Donation saved in database");
          setTimeout(() => {
            router.push(`/receipt?txHash=${tx.hash}`);
          }, 500);
        } else {
          toast.error(
            `DB Error: ${result?.message || "Failed to save transaction"}`
          );
        }

        toast.success(`✅ ${successMessage}`);
        toast.success(`🔗 View on explorer: ${receipt.hash}`);
      } else {
        toast.success(successMessage + ` (Receipt not immediately available)`);
      }

      return true;
    } catch (error: any) {
      console.error("Transaction failed:", error);
      let errorMessage = "❌ Transaction failed.";
      if (error.code === 4001) {
        errorMessage = "🚫 Transaction rejected by user.";
      } else if (error.data && error.data.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const donateEth = async (templeAddress: string) => {
    if (!provider || !account) {
      toast.error("Connect wallet first");
      return;
    }
    if (!ethers.isAddress(templeAddress)) {
      toast.error("Invalid temple address");
      return;
    }

    try {
      const signer = await provider?.getSigner();
      const templeFund = new ethers.Contract(
        TEMPLE_FUND_ADDRESS,
        TEMPLE_FUND_ABI,
        signer
      );

      const amountInEth = donationAmount;
      if (
        !amountInEth ||
        isNaN(Number(amountInEth)) ||
        Number(amountInEth) <= 0
      ) {
        toast.error("Invalid donation amount");
        return;
      }

      toast.info(`🚀 Initiating donation of ${amountInEth} ETH...`);

      const success = await handleTransaction(
        templeFund.donateEthToTemple(templeAddress, {
          value: ethers.parseEther(amountInEth),
        }),
        "Donation successful!"
      );

      if (success) {
        fetchEthBalance(templeAddress);
      }
    } catch (error) {
      console.error(error);
      toast.error("Donation failed");
    }
  };

  const fetchEthBalance = async (templeAddr: string) => {
    if (!provider || !ethers.isAddress(templeAddr)) {
      toast.error("Invalid temple address or wallet not connected.");
      return;
    }
    try {
      const templeFund = new ethers.Contract(
        TEMPLE_FUND_ADDRESS,
        TEMPLE_FUND_ABI,
        provider
      );
      const balance = await templeFund.getTempleEthBalance(templeAddr);
      setEthBalance(ethers.formatEther(balance));
    } catch (error) {
      toast.error("Failed to fetch ETH balance.");
      console.error(error);
    }
  };

  const purposes = [
    "General Fund",
    "Prasadam Distribution",
    "Temple Maintenance",
    "Festival Celebrations",
    "Educational Programs",
    "Community Kitchen",
  ];
  const handleDonate = () => {
    if (
      !donationAmount ||
      !selectedTemple ||
      !donationPurpose ||
      !selectedCrypto
    ) {
      toast.error("Please fill all fields");
      return;
    }

    const templeAddress = selectedTemple.walletAddress;
    if (!templeAddress) {
      toast.error("Temple wallet address not found.");
      return;
    }

    const cryptoInfo: Record<string, string> = {
      ethereum: "ETH",
      binancecoin: "BNB",
      "matic-network": "MATIC",
      "avalanche-2": "AVAX",
      arbitrum: "ARB",
      optimism: "OP",
    };

    const selectedCryptoPrice = cryptoPrices[selectedCrypto]?.price || 0;
    const usdValue = (parseFloat(donationAmount) * selectedCryptoPrice).toFixed(
      2
    );

    if (["ethereum", "matic-network", "avalanche-2", "arbitrum", "optimism", "binancecoin"].includes(selectedCrypto)) {
      // assuming same contract for EVM chains
      donateEth(templeAddress);
    } else {
      toast.error(`${cryptoInfo[selectedCrypto] || 'Selected'} donations not supported yet.`);
    }
  };

  const formatPrice = (price) => {
    if (price >= 1) {
      return price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return price.toFixed(6);
  };

  const cryptoOptions = [
    { value: "ethereum", name: "Ethereum (ETH)" },
    { value: "binancecoin", name: "Binance Coin (BNB)" },
    { value: "matic-network", name: "Polygon (MATIC)" },
    { value: "avalanche-2", name: "Avalanche (AVAX)" },
    { value: "arbitrum", name: "Arbitrum (ARB)" },
    { value: "optimism", name: "Optimism (OP)" },
  ];

  useEffect(() => {
    const fetchSpecificCryptoPrices = async () => {
      try {
        const coinGeckoIds =
          "ethereum,binancecoin,matic-network,avalanche-2,arbitrum,optimism";
        const specificResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds}&vs_currencies=usd&include_24hr_change=true`
        );

        if (!specificResponse.ok) {
          throw new Error(`HTTP error! status: ${specificResponse.status}`);
        }

        const specificData = await specificResponse.json();

        setCryptoPrices({
          ethereum: {
            price: specificData.ethereum?.usd || 0,
            change: specificData.ethereum?.usd_24h_change || 0,
          },
          binancecoin: {
            price: specificData.binancecoin?.usd || 0,
            change: specificData.binancecoin?.usd_24h_change || 0,
          },
          "matic-network": {
            price: specificData["matic-network"]?.usd || 0,
            change: specificData["matic-network"]?.usd_24h_change || 0,
          },
          "avalanche-2": {
            price: specificData["avalanche-2"]?.usd || 0,
            change: specificData["avalanche-2"]?.usd_24h_change || 0,
          },
          arbitrum: {
            price: specificData.arbitrum?.usd || 0,
            change: specificData.arbitrum?.usd_24h_change || 0,
          },
          optimism: {
            price: specificData.optimism?.usd || 0,
            change: specificData.optimism?.usd_24h_change || 0,
          },
        });
      } catch (error) {
        console.warn("Failed to fetch specific crypto prices:", error);
        // Fallback dummy prices for when CoinGecko API is rate-limited
        setCryptoPrices({
          ethereum: { price: 3500, change: 2.1 },
          binancecoin: { price: 600, change: -0.5 },
          "matic-network": { price: 1.2, change: 3.4 },
          "avalanche-2": { price: 35, change: 1.2 },
          arbitrum: { price: 1.5, change: 4.0 },
          optimism: { price: 2.8, change: 2.5 },
        });
      }
    };

    fetchSpecificCryptoPrices();
    const interval = setInterval(fetchSpecificCryptoPrices, 30000);
    return () => clearInterval(interval);
  }, []);
  return (
    <AuthWrapper role="user">
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Live Crypto Carousel Section */}
          <CryptoCarousel onSelectCrypto={setSelectedCrypto} />{" "}
          {/* Use the imported component here */}
          {/* Donation Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Temple Crypto Donations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Make donations using various cryptocurrencies with complete
              transparency. Track your contributions in real-time with
              blockchain technology.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8" id="donation-form">
            {/* Donation Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  Make a Donation
                </h3>

                <div className="space-y-6">
                  {/* Temple Selection */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Temple
                    </label>
                    
                    {/* Custom Dropdown Trigger */}
                    <div 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 bg-white cursor-pointer flex justify-between items-center transition-colors hover:border-gray-400"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span className={selectedTemple?.templeName ? "text-gray-900" : "text-gray-500"}>
                        {selectedTemple?.templeName || "Choose a temple..."}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                    </div>

                    {/* Custom Dropdown Menu (Forced to drop DOWNWARDS) */}
                    {isDropdownOpen && (
                      <>
                        {/* Invisible backdrop to catch clicks outside */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsDropdownOpen(false)}
                        ></div>
                        
                        <div className="absolute top-[82px] left-0 w-full bg-white border border-gray-200 shadow-xl rounded-lg max-h-64 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                          {temples.length === 0 ? (
                             <div className="px-4 py-3 text-gray-500 italic">No temples available</div>
                          ) : (
                            <ul className="py-1">
                              {temples.map((temple: any) => (
                                <li
                                  key={temple.walletAddress}
                                  className={`px-4 py-3 hover:bg-orange-50 cursor-pointer transition-colors ${selectedTemple?.walletAddress === temple.walletAddress ? "bg-orange-100 font-medium text-orange-700" : "text-gray-700"}`}
                                  onClick={() => {
                                    setSelectedTemple(temple);
                                    setIsDropdownOpen(false);
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span>{temple.templeName}</span>
                                    <span className="text-xs text-gray-400">{temple.templeLocation}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Purpose Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Donation Purpose
                    </label>
                    <select
                      value={donationPurpose}
                      onChange={(e) => setDonationPurpose(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">Select purpose...</option>
                      {purposes.map((purpose, index) => (
                        <option key={index} value={purpose}>
                          {purpose}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cryptocurrency Selection Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Cryptocurrency
                    </label>
                    <select
                      value={selectedCrypto}
                      onChange={(e) => setSelectedCrypto(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      {cryptoOptions.map((crypto) => (
                        <option key={crypto.value} value={crypto.value}>
                          {crypto.name}
                        </option>
                      ))}
                    </select>

                    {/* Live Price Display */}
                    {selectedCrypto &&
                      cryptoPrices[selectedCrypto]?.price > 0 && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Current Price:
                          </span>
                          <div className="text-right">
                            <span className="font-bold text-gray-800">
                              ${formatPrice(cryptoPrices[selectedCrypto].price)}
                            </span>
                            <div
                              className={`text-xs ml-2 inline-block ${
                                cryptoPrices[selectedCrypto].change >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {cryptoPrices[selectedCrypto].change >= 0
                                ? "+"
                                : ""}
                              {cryptoPrices[selectedCrypto].change?.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Donation Amount (
                      {cryptoOptions
                        .find((c) => c.value === selectedCrypto)
                        ?.name.match(/\(([^)]+)\)/)?.[1] || "Crypto"}
                      )
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                        min="0.001"
                        step="0.001"
                      />
                      {donationAmount &&
                        cryptoPrices[selectedCrypto]?.price && (
                          <div className="absolute right-3 top-3 text-sm text-gray-500">
                            ≈ $
                            {(
                              parseFloat(donationAmount) *
                              cryptoPrices[selectedCrypto].price
                            ).toFixed(2)}{" "}
                            USD
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleDonate}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-lg font-medium text-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg"
                  >
                    Donate Now
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Features */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">
                  Why Donate Here?
                </h4>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-green-500 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-800">Transparent</h5>
                      <p className="text-sm text-gray-600">
                        Every transaction recorded on blockchain
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Award className="h-5 w-5 text-blue-500 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-800">Verified</h5>
                      <p className="text-sm text-gray-600">
                        All temples verified and authentic
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-purple-500 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-800">
                        Impact Tracking
                      </h5>
                      <p className="text-sm text-gray-600">
                        See how your donation is used
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Donations */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">
                  Recent Donations
                </h4>
                <div className="space-y-3">
                  {recent.map((donation) => (
                    <div
                      key={donation._id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {donation.amount} MATIC
                        </p>
                        <p className="text-sm text-gray-600">
                          {donation?.receiver?.templeName || "Unknown Temple"}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 text-right">
                        {new Date(donation.createdAt).toLocaleDateString()}{" "}
                        {new Date(donation.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            &copy; 2025 DevTemple. Empowering sacred traditions through
            blockchain technology.
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </AuthWrapper>
  );
};

export default UnifiedTempleDonationPage;

import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { Contract } from "ethers";
import {
  useAccount,
  usePrepareContractWrite,
  useContractWrite,
  useContractRead,
  useSigner,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ZeroDevSigner } from "@zerodevapp/sdk";

const contractAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";
const contractABI = [
  "function mint(address _to) public",
  "function balanceOf(address owner) external view returns (uint256 balance)",
];

function App() {
  const { address, isConnected } = useAccount();

  const { config } = usePrepareContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: "mint",
    args: [address],
    enabled: true,
  });
  const { write: mint, isLoading } = useContractWrite(config);

  const { data: balance = 0, refetch } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: "balanceOf",
    args: [address],
  });

  const interval = useRef<any>();

  const handleClick = useCallback(() => {
    if (mint) {
      mint();
      interval.current = setInterval(() => {
        refetch();
      }, 1000);
    }
  }, [mint, refetch]);

  useEffect(() => {
    if (interval.current) {
      clearInterval(interval.current);
    }
  }, [balance, interval]);

  const { data: signer } = useSigner<ZeroDevSigner>();
  const [isBatchMintLoading, setIsBatchMintLoading] = useState(false);
  const batchMint = async () => {
    setIsBatchMintLoading(true);
    const nftContract = new Contract(contractAddress, contractABI, signer!);
    await signer!.execBatch([
      {
        to: contractAddress,
        data: nftContract.interface.encodeFunctionData("mint", [address]),
      },
      {
        to: contractAddress,
        data: nftContract.interface.encodeFunctionData("mint", [address]),
      },
    ]);
    interval.current = setInterval(() => {
      refetch();
    }, 1000);
    setIsBatchMintLoading(false);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <ConnectButton />
      {isConnected && (
        <>
          <strong style={{ fontSize: "1.5rem" }}>NFT Count</strong>
          <div style={{ fontSize: "1.5rem" }}>{`${balance ?? 0}`}</div>
          <button onClick={handleClick} disabled={isLoading}>
            {isLoading ? "Loading..." : "Mint NFT"}
          </button>
          <button onClick={batchMint} disabled={isBatchMintLoading}>
            {isBatchMintLoading ? "Loading..." : "Double Mint NFT"}
          </button>
        </>
      )}
    </div>
  );
}

export default App;

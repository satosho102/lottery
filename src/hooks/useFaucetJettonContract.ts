import { useAsyncInitialize } from "./useAsyncInitialize";
import { useTonClient } from "./useTonClient";
import { useTonConnect } from "./useTonConnect";
import { Address, OpenedContract, toNano, fromNano } from "ton-core";
//import FaucetJettonWallet from "../contracts/faucetJettonWallet";
//import FaucetJetton from "../contracts/faucetJetton";
const sleep = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));

import { JettonDefaultWallet } from "../../build/Master/tact_JettonDefaultWallet";
import { useQuery } from "@tanstack/react-query";
import { Mint, Master } from "../../build/Master/tact_Master";
import { useEffect, useState } from "react";

export function useFaucetJettonContract() {
  const { wallet, sender } = useTonConnect();
  const { client } = useTonClient();
  const [balance, setBalance] = useState<string | null>();

  // jetton contract
  // const jettonContract = useAsyncInitialize(async () => {
  //   if (!client || !wallet) return;

  //   const contract = Master.fromAddress(
  //     Address.parse("EQA1MW2YoJnPdrNVEeKRmePvSZHZNmLcR05afMbkmjKILAKi")
  //   );

  //   return client.open(contract) as OpenedContract<Master>;
  // }, [client, wallet]);

  const jettonContract = useAsyncInitialize(async () => {
    if (!client || !wallet) return;

    const contract = Master.fromAddress(
      Address.parse("EQBKMXyqWtmGqQeVFb7Irki_dWz2mF6MUYxP2pVPQAKZTpYW")
    );

    return client.open(contract) as OpenedContract<Master>;
  }, [client, wallet]);

  // user's jetton wallet
  const jwContract = useAsyncInitialize(async () => {
    if (!jettonContract || !client) return;
    const jettonWalletAddress = await jettonContract!.getGetWalletAddress(
      Address.parse(Address.parse(wallet!).toString())
    );

    // open user's jetton wallet
    return client.open(JettonDefaultWallet.fromAddress(jettonWalletAddress));
  }, [jettonContract, client]);

  useEffect(() => {
    async function getBalance() {
      if (!jwContract) return;
      setBalance(null);
      const balance = (await jwContract.getGetWalletData()).balance;
      setBalance(fromNano(balance));
      await sleep(5000);
      getBalance();
    }

    getBalance();
  }, [jwContract]);

  return {
    mint: () => {
      const message: Mint = {
        $$type: "Mint",
        amount: toNano("500"),
        receiver: Address.parse(Address.parse(wallet!).toString()),
      };

      jettonContract?.send(
        sender,
        {
          value: toNano("0.05"),
        },
        message
      );
    },
    jettonWalletAddress: jwContract?.address.toString(),
    balance: balance,
  };
}

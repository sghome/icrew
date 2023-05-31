const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const evmChains = window.evmChains;
let web3Modal;
let provider;
let selectedAccount;
let presaleconfig;

var md = new MobileDetect(window.navigator.userAgent);

const etherscanURI = "https://rinkeby.etherscan.io/";
const NFTabi = [
  {
    inputs: [],
    name: "FREN_PRICE",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address"
      }
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "quantity",
        type: "uint256"
      }
    ],
    name: "mintFrens",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "quantity",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_MAX_CLAIM_FRENS_ON_PRESALE",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_START_PRESALE_MINT_TIMESTAMP",
        type: "uint256"
      },
      {
        internalType: "bytes",
        name: "_SIGNATURE",
        type: "bytes"
      }
    ],
    name: "mintPresaleFrens",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_MAX_CLAIM_FRENS_ON_PRESALE",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_START_PRESALE_MINT_TIMESTAMP",
        type: "uint256"
      },
      {
        internalType: "bytes",
        name: "_SIGNATURE",
        type: "bytes"
      }
    ],
    name: "isPresaleEligible",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
];

const nftAddress = "0x0c67171D2BB84b35763bD2905B95968976da28B1";

function init() {
  //console.log("Initializing example");
  // console.log("WalletConnectProvider is", WalletConnectProvider);
  // console.log("Fortmatic is", Fortmatic);
  // console.log("window.web3 is", window.web3, "window.ethereum is", window.ethereum);
  // if(md.mobile()!=null){
  //   if (!window.ethereum || !window.ethereum.isMetaMask) {
  //       window.location = "https://metamask.app.link/dapp/rugpullfrens.art/minter/";
  //   } 
  // }
  
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: "a6752658a0bf4f8c8405a13069677775"
      }
    }
  };

  web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
    disableInjectedProvider: false // optional. For MetaMask / Brave / Opera.
  });

  // console.log("Web3Modal instance is", web3Modal);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// function log(inp) {
//   console.log(inp);
// }

// async function TxListner(txhash) {
//   const web3 = new Web3(provider);
//   var Mined = false;
//   while (!Mined) {
//     var Blocked = await web3.eth.getTransaction(txhash);
//     if (Blocked.blockNumber == null) {
//       await sleep(3000);
//     } else {
//       await sleep(2000);
//       Mined = true;
//       return true;
//     }
//   }
// }

// async function GASR() {
//   var gass;
//   var UL = "https://ethgasstation.info/api/ethgasAPI.json?";
//   var settings = { menthod: "Get" };
//   await fetch(UL, settings)
//     .then((res) => res.json())
//     .then((json) => {
//       gass = json.fastest;
//     });
//   return gass / 10;
// }

async function NFTminter() {
  const web3 = new Web3(provider);
  // var gassy = await GASR();
  const acc = await web3.eth.getAccounts();
  var FROM = acc[0];
  var Pbox = document.getElementById("NftAmt");
  var BAmount = Pbox.value;
  const NFT = new web3.eth.Contract(NFTabi, nftAddress);
  var price = await NFT.methods.FREN_PRICE().call({});
  var Bprice = web3.utils.toBN(price).mul(web3.utils.toBN(BAmount));


  NFT.methods
    .mintPresaleFrens(
      BAmount,
      presaleconfig.maxClaimNumOnPresale,
      presaleconfig.startTimestampForPresale,
      presaleconfig.signedSignature
    )
    .send({ from: FROM, value: Bprice })
    .on("transactionHash", function (hash) {
      document.getElementById("tx_result").innerHTML =
        '<p>View Transaction Detail on Etherscan:<br><a href="' +
        etherscanURI +"/tx/" +hash +'" target="blank">' +hash +"</a></p>";
      document.getElementById("tx_result").style ="display:block;";
    })
    .on('confirmation', function(confirmationNumber, receipt){
      console.log(receipt);
      // document.getElementById("hash").innerHTML =
      //   "<p>View NFT collection on <a href='https://testnets.opensea.io/assets/"+nftAddress+"/"+ "251" +"'>Opensea</a></p>";
      NFTnum();
      updateSoldCount();
    })
    .on("error", function (error, receipt) {
      console.log(error);
      console.log(receipt);
      if (error.message.indexOf("NOT_ELIGIBLE_FOR_PRESALE") > -1) {
        alert("Sorry, your address is not in presale list.");
        onDisconnect();
      } else if (error.message.indexOf("insufficient funds") > -1) {
        alert("Sorry, seems your wallet doesn't have enough funds to make this purchase!");
      } else if (error.message.indexOf("YOUR_PRESALE_MINTING_TIME_NOT_STARTED") > -1) {
        alert("Sorry, your minting time is not started!");
      } else if (error.message.indexOf("EXCEEDS_MAX_CLAIMED_NUM_ON_ADDR_OR_BELOW_ONE") > -1) {
        alert("Sorry, your minting quantity is invalid, please double check before minting");
      } else if (error.message.indexOf("EXCEEDS_PRESALE_SUPPLY") > -1) {
        alert("Sorry, all presale token has sold out");
      } else if (error.message.indexOf("SENDING_INVALID_ETHERS") > -1) {
        alert("Sorry, you are sending weong ether value, please double check.");
      } else {
        document.getElementById("tx_recipt").innerHTML = "<p>Transaction Failed!</p>";
        document.getElementById("tx_recipt").style = "display:block" ;
        // document.getElementById("tx_result").innerHTML =
        //   '<p>May have been an error check to make sure transaction was a success<br><a href="' +
        //   etherscanURI +
        //   "/tx/" +
        //   txHash +
        //   '" target="blank">' +
        //   txHash +
        //   "...</a></p>";
      }
    });

  //   var myData = NFT.methods
  //     .mintPresaleFrens(
  //       BAmount,
  //       presaleconfig.maxClaimNumOnPresale,
  //       presaleconfig.startTimestampForPresale,
  //       presaleconfig.signedSignature
  //     )
  //     .encodeABI();
  //   let gas = await NFT.methods
  //     .mintPresaleFrens(
  //       BAmount,
  //       presaleconfig.maxClaimNumOnPresale,
  //       presaleconfig.startTimestampForPresale,
  //       presaleconfig.signedSignature
  //     )
  //     .estimateGas({
  //       from: FROM,
  //       value: Bprice.toString()
  //     })
  //     .catch(function (error) {
  //       if (error.message.indexOf("insufficient funds") > -1) {
  //         alert(
  //           "Sorry, seems your wallet doesn't have enough funds to make this purchase!"
  //         );
  //       }
  //       log(error);
  //     });

  //   var txObject = {
  //     nonce: web3.utils.toHex(0),
  //     to: nftAddress,
  //     from: FROM,
  //     value: web3.utils.toHex(Bprice.toString()),
  //     gas: web3.utils.toHex(gas + 20000),
  //     gasPrice: web3.utils.toHex(web3.utils.toWei(gassy.toString(), "gwei")),
  //     data: myData
  //   };

  //   const tHash = await web3.eth
  //     .sendTransaction(txObject)
  //     .once("transactionHash", async (txHash) => {
  //       document.getElementById("hash").innerHTML =
  //         "<p>Minting transaction processing...</p>";
  //       var suces = await TxListner(txHash);
  //       document.getElementById("hash").innerHTML =
  //         '<p>View Transaction Detail on Etherscan:<br><a href="' +
  //         etherscanURI +
  //         "/tx/" +
  //         txHash +
  //         '" target="blank">' +
  //         txHash +
  //         "</a></p><p>View NFT collection on <a href='https://testnets.opensea.io/collection/rugpullfrens'>Opensea</a></p>";
  //       NFTnum();
  //       updateSoldCount();
  //     })
  //     .catch(function (error) {

  //     });
}

async function BoxPrice() {
  const web3 = new Web3(provider);
  const NFT = new web3.eth.Contract(NFTabi, nftAddress);
  var price = await NFT.methods.FREN_PRICE().call({});
  document.getElementById("BoxPrice").innerHTML =
    web3.utils.fromWei(price) + " Eth";
}

async function NFTnum() {
  const web3 = new Web3(provider);
  const acc = await web3.eth.getAccounts();
  var FROM = acc[0];
  var ERC721contract = new web3.eth.Contract(NFTabi, nftAddress);
  var NFTAMT = await ERC721contract.methods.balanceOf(FROM).call({});
  var QT;
  if (NFTAMT == 1) {
    QT = " FRΞN";
  } else {
    QT = " FRΞNS";
  }
  document.getElementById("nums").innerHTML = NFTAMT + QT;
  document.getElementById("Uwallet").innerHTML =
    '<a href="' +
    etherscanURI +
    "/address/" +
    FROM +
    '" target="blank">' +
    FROM +
    "</a>";
}

async function NFTcost() {
  const web3 = new Web3(provider);
  var Pbox = document.getElementById("NftAmt");
  var BAmount = Pbox.value;
  const NFT = new web3.eth.Contract(NFTabi, nftAddress);
  var price = await NFT.methods.FREN_PRICE().call({});
  var Bprice = web3.utils.toBN(price).mul(web3.utils.toBN(BAmount));
  if (BAmount > presaleconfig.maxClaimNumOnPresale) {
    alert(
      "Can't buy more than " + presaleconfig.maxClaimNumOnPresale.toString()
    );
    Pbox.value = presaleconfig.maxClaimNumOnPresale;
    var BAmount = (Amount = Pbox.value);
    var Bprice = web3.utils.toBN(price).mul(web3.utils.toBN(BAmount));
    document.getElementById("Total").innerHTML =
      web3.utils.fromWei(Bprice.toString()) + " ETH";
  } else {
    document.getElementById("Total").innerHTML =
      web3.utils.fromWei(Bprice.toString()) + " ETH";
  }
}

async function updateSoldCount() {
  const web3 = new Web3(provider);
  const nft = new web3.eth.Contract(NFTabi, nftAddress);
  const totalSupply = await nft.methods.totalSupply().call({});
  console.log({ nft });
  document.querySelector("#sold-count").innerHTML = totalSupply;
}

async function loadPresaleConfig() {
  const web3 = new Web3(provider);
  const acc = await web3.eth.getAccounts();
  var FROM = acc[0];

  axios
    .get("https://testgen.api.rugpullfrens.art/whitelist/" + FROM)
    .then(function (response) {
      presaleconfig = response.data;
      if (presaleconfig == "Not Eligible For Presale") {
        alert("You Are Not Eligible For Presale");
        onDisconnect();
      }

      var date = new Date(presaleconfig.startTimestampForPresale * 1000);
      document.getElementById("startTimestampForPresale_down").innerHTML = date;
      console.log(presaleconfig);

      // qualification data
      document.getElementById("maxClaimNumOnPresale").innerHTML =
        "You Can Mint at Most : " +
        presaleconfig.maxClaimNumOnPresale +
        " FRΞNS";
      document.getElementById("startTimestampForPresale").innerHTML =
        "Eligible Minting From : <br>" + date;

      document.getElementById("maxMintNumNotification").innerHTML =
        "Max Mint: " + presaleconfig.maxClaimNumOnPresale;
      document.getElementById("NftAmt").value =
        presaleconfig.maxClaimNumOnPresale;

      console.log(presaleconfig.startTimestampForPresale);
      var timeTomint =
        presaleconfig.startTimestampForPresale - Math.floor(Date.now() / 1000);
      console.log(timeTomint);
      if (timeTomint >= 0) {
        document.getElementById("buyNFT").disabled = true;
        document.getElementById("buyNFT").innerHTML = "\n                    Unavailable Now\n                  ";
      }

      NFTcost();
    })
    .catch(function (error) {
      console.log(error);
    });

  // .finally(function () {
  //   // always executed
  //   console.log('I always Execued');
  // });
}

async function checkEligibleOnContract() {
  // check on smart contract
  const web3 = new Web3(provider);
  const acc = await web3.eth.getAccounts();
  var ERC721contract = new web3.eth.Contract(NFTabi, nftAddress);
  // console.log("verify for the following config:");
  // console.log(presaleconfig.maxClaimNumOnPresale);
  // console.log(presaleconfig.startTimestampForPresale);
  // console.log(presaleconfig.signedSignature);
  // console.log(", and call from :"+acc[0]);
  var isPresaleEligible = await ERC721contract.methods
    .isPresaleEligible(
      presaleconfig.maxClaimNumOnPresale,
      presaleconfig.startTimestampForPresale,
      presaleconfig.signedSignature
    )
    .call({
      from: acc[0]
    });
  if (isPresaleEligible) {
    document.getElementById("verifyOnSmartContract").innerHTML =
      "Verfity Above Conditions On Contract : <span style='color:green'>Verified!<br>**You have been verified for above conditions to mint FRΞNS</span>";
  } else {
    document.getElementById("verifyOnSmartContract").innerHTML =
      "Verfity Above Conditions On Contract : <span style='color:red'>Failed!<br>**Your verification for contract is failed! please DM Admin on Discord</span>";
  }
}

async function onConnect() {
  console.log("Opening a dialog", web3Modal);
  var presaleconfig;
  try {
    provider = await web3Modal.connect();
    presaleconfig = loadPresaleConfig();

    // set listenser for amount input
    const Tnm = document.getElementById("NftAmt");
    Tnm.addEventListener("input", () => {
      NFTcost();
    });
  } catch (e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  provider.on("accountsChanged", (accounts) => {
    NFTcost();
    NFTnum();
    updateSoldCount();
  });

  provider.on("chainChanged", (chainId) => {});

  document.querySelector("#prepare").style.display = "none";
  document.querySelector("#connected").style.display = "block";

  NFTcost();
  NFTnum();
  BoxPrice();
  updateSoldCount();
}

async function onDisconnect() {
  console.log("Killing the wallet connection", provider);

  if (provider.disconnect) {
    await provider.disconnect();

    await web3Modal.clearCachedProvider();
    provider = null;
  }

  selectedAccount = null;
  document.querySelector("#prepare").style.display = "block";
  document.querySelector("#connected").style.display = "none";
}

window.addEventListener("load", async () => {
  init();
  document.querySelector("#btn-connect").addEventListener("click", onConnect);
  document
    .querySelector("#btn-disconnect")
    .addEventListener("click", onDisconnect);
  document.querySelector("#buyNFT").addEventListener("click", NFTminter);
});

async function switchNetwork() {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xf00" }]
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{ chainId: "0xf00", rpcUrl: "https://..." /* ... */ }]
        });
      } catch (addError) {
        // handle "add" error
      }
    }
    // handle other "switch" errors
  }
}

var container, pageInner, Head;
var winW = window.innerWidth;

function animation_init() {
  container = document.getElementById("page_container");
  Head = document.querySelector("header");

  imagesLoaded(container, function (instance) {
    document.body.classList.add("loaded");
  });
}

window.addEventListener("DOMContentLoaded", (event) => {
  animation_init();
});
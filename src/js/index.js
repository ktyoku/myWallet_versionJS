// const recognizer = require('ethereum-keyfile-recognizer');
var createAccountSection = document.getElementById('createAccount');
var importAccountSection = document.getElementById('importAccount');
var viewWalletSection = document.getElementById('viewWallet');
var sendETHSection = document.getElementById('sendETH');
let inputTags = document.getElementsByTagName('input');
let downloadTag = document.getElementById('download');
let textareaTags = document.getElementsByTagName('textarea');
let tdTags = document.getElementsByTagName('td');
let cards = document.querySelectorAll('.card');

let headTabs = document.getElementsByClassName('nav-item');

const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/ba41ececaf944f7bbdf9bf62f916f8a8"));

const account0Address = "0x37F9C70E4E96fDCB938504D0e66b907F20989b62";
//   private = 61ddf633529ce7fe8307c855b88f0db661b5419d652f7ee21aaa9a34b4840b58
//   address = 0x94c3E22d1fC12aEA361Bc9a34a179E28E5e44284

const address20 = "0x038d7ce57e07e92f9f2fb666eaffea058901ef40"
const address721 = "0x8e78d311cea20279a19ee237ad381f5d3a64bc91";
let keyObj;


window.addEventListener('load', function(){
  web3.eth.getGasPrice().then((gasPrice) => {
    document.getElementById('gasPrice').value = gasPrice;
  })

  changeTabs();
})

document.getElementById('createNewAccount').addEventListener('click', function(){
  let password = document.getElementById('enterPassword').value;

  if (password === "") {
    alert('Enter a password.');
  } else {
    let account = web3.eth.accounts.create();
    let keystore = web3.eth.accounts.encrypt(account.privateKey, password);
    let blob = new Blob([JSON.stringify(keystore)], { "type" : "application/json" });
    let url = URL.createObjectURL(blob);

    document.getElementById('download').setAttribute('href', url);
    document.getElementById('download').addEventListener('click', function(){
      document.getElementById('continue').disabled = false;
    })

    document.getElementById('yourPrivateKey').value = account.privateKey;

    document.getElementById('saveYourAddress').addEventListener('click', function(){
      importAccount(account);
      importAccountSection.style.display = 'none';
      createAccountSection.style.display = 'none';
      viewWalletSection.style.display = 'block';
      headTabs[1].classList.remove('active');
      headTabs[0].classList.add('active');
    })

    cards[0].style.display = 'none';
    cards[1].style.display = 'block';
  }

}, false);

document.getElementById('continue').addEventListener('click', function(){
  cards[1].style.display = 'none';
  cards[2].style.display = 'block';
})

document.getElementById('unlockWithKey').addEventListener('click', function(){
  let privateKey = document.getElementById('inputKey').value;

  if (!privateKey.match(/^[0-9A-Fa-f]{64}$/)) {
    alert('Enter the private key.')
  } else {
    let account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
    //addressを表示
    importAccount(account);

    importAccountSection.style.display = 'none';
    viewWalletSection.style.display = 'block';
    sendETHSection.style.display = 'block';

  }
})

document.getElementById('inputKeystore').addEventListener('change', function(e){
  const file = e.target.files[0];
  e.target.nextElementSibling.textContent = file.name;

  var reader = new FileReader();

  reader.addEventListener('load', function(){

    try {
      keyObj = JSON.parse(reader.result);
      // console.log(keyObj);
      // var result = recognizer(keyObj);
      // if (result == null) {
      //   throw new Error();
      // }
    } catch (e) {
      alert("keystoreを選択してください。")
    }
  })

  reader.readAsText(file);
})

document.getElementById('unlockWithKeystore').addEventListener('click', function(){
  let password = document.getElementById('enterYourPassword').value;
  if (password === "") {
    alert("Enter the password.");
  } else {
    const account = web3.eth.accounts.decrypt(keyObj, password);
    importAccount(account);

    importAccountSection.style.display = 'none';
    viewWalletSection.style.display = 'block';
    sendETHSection.style.display = 'block';
  }
})

document.getElementById('generateTransaction').addEventListener('click', async function(){
  let addressFrom = document.querySelector('#yourAddress td').textContent;
  let addressTo = document.getElementById('toAddress').value;
  let gasPrice = document.getElementById('gasPrice').value;
  let gasLimit = document.getElementById('gasLimit').value;
  let value =  document.getElementById('amountToSend').value;
  let privateKey = document.querySelector('#yourPrivateKey td').textContent

  let nonce = await web3.eth.getTransactionCount(addressFrom);
  let rawTransaction = {
          nonce: web3.utils.toHex(nonce),
          gasPrice: web3.utils.toHex(gasPrice),
          gasLimit: web3.utils.toHex(gasLimit),
          to: addressTo,
          value: web3.utils.toHex(web3.utils.toWei(value, 'ether')),
          data: "0x"
        };
  let transaction =  new ethereumjs.Tx(rawTransaction);
  privateKey = new ethereumjs.Buffer.Buffer(privateKey.substr(2), 'hex');
  transaction.sign(privateKey);
  let serializeTx = transaction.serialize();
  let signedTransaction = '0x' + serializeTx.toString('hex');

  document.getElementById('rawTransaction').textContent = JSON.stringify(rawTransaction);
  document.getElementById('signedTransaction').textContent = signedTransaction;
})

document.getElementById('sendTransaction').addEventListener('click', function(){
  let signedTransaction = document.getElementById('signedTransaction').textContent;

  web3.eth.sendSignedTransaction(signedTransaction)
    .on('transactionHash', function(hash){
      console.log(hash);
    })
    .on('receipt', function(receipt){
      console.log(receipt);

      let account = web3.eth.accounts.privateKeyToAccount(document.querySelector('#yourPrivateKey td').textContent);
      importAccount(account);
      resetTX();
      $('#sendTxModal').modal('hide')
    })
    .on('error', function(error){
      alert(error)
    });
})

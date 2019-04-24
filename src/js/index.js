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

const tokenTabs = document.getElementsByClassName('tokenTab');
const saveTokenForms = document.getElementsByClassName('saveTokenFrom');

const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/ba41ececaf944f7bbdf9bf62f916f8a8"));
let erc20Contract = new web3.eth.Contract(ierc20Abi);
let erc721Contract = new web3.eth.Contract(ierc721Abi);


const account0Address = "0x37F9C70E4E96fDCB938504D0e66b907F20989b62";
//   private = 61ddf633529ce7fe8307c855b88f0db661b5419d652f7ee21aaa9a34b4840b58
//   address = 0x94c3E22d1fC12aEA361Bc9a34a179E28E5e44284

const address20 = "0x220b27d77a5ae634575cb2392bdbf7a1557798a0"
const address721 = "0xe0bfcd86343c0ffc5f5191ef1734651906b706ee";
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

  let privateKeyBuffer = ethereumjs.Util.toBuffer("0x" + privateKey)
  // console.log(utilBuffer);
  let judgePrivateKey = ethereumjs.Util.isValidPrivate(privateKeyBuffer)
  console.log(judgePrivateKey)

  if (!ethereumjs.Util.isValidPrivate(privateKeyBuffer)) {
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
  let privateKey = document.querySelector('#yourPrivateKey td').textContent;
  let unit = document.querySelector('.dropdown-toggle').textContent;

  if (unit === 'Rinkeby ETH') {
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
    console.log(transaction);
    privateKey = new ethereumjs.Buffer.Buffer(privateKey.substr(2), 'hex');
    transaction.sign(privateKey);
    let serializeTx = transaction.serialize();
    let signedTransaction = '0x' + serializeTx.toString('hex');

    document.getElementById('rawTransaction').textContent = JSON.stringify(rawTransaction);
    document.getElementById('signedTransaction').textContent = signedTransaction;
  } else {
    const contractAddress = document.getElementById(unit).getAttribute('contractAddress');
    erc20Contract.options.address = contractAddress;
    const decimals = document.getElementById(unit).getAttribute('decimals');
    value = value * (10 ** decimals);

    // console.log(value);
    const estimateGas = await erc20Contract.methods.transfer(addressTo, value.toString()).estimateGas({from: addressFrom})
    .then((gasAmount) => {
      return gasAmount;
    })
    .catch(function(error){
        console.log(error);
    });

    if (gasLimit < estimateGas) {
      alert(estimateGas + '以上にgasLimitを設定しましょう')
      return false;
    }

    let data = erc20Contract.methods.transfer(addressTo, value.toString()).encodeABI();
    let nonce = await web3.eth.getTransactionCount(addressFrom);
    let rawTransaction = {
            nonce: web3.utils.toHex(nonce),
            gasPrice: web3.utils.toHex(gasPrice),
            gasLimit: web3.utils.toHex(gasLimit),
            to: contractAddress,
            data: data
          };
    let transaction =  new ethereumjs.Tx(rawTransaction);
    privateKey = new ethereumjs.Buffer.Buffer(privateKey.substr(2), 'hex');
    transaction.sign(privateKey);
    let serializeTx = transaction.serialize();
    let signedTransaction = '0x' + serializeTx.toString('hex');

    document.getElementById('rawTransaction').textContent = JSON.stringify(rawTransaction);
    document.getElementById('signedTransaction').textContent = signedTransaction;
  }
})

document.getElementById('sendTransaction').addEventListener('click', function(){
  let rawTransaction = document.getElementById('rawTransaction').textContent
  let signedTransaction = document.getElementById('signedTransaction').textContent;

  web3.eth.sendSignedTransaction(signedTransaction)
    .on('transactionHash', function(hash){
      console.log(hash);
    })
    .on('receipt', function(receipt){
      console.log(receipt);

      if (JSON.parse(rawTransaction).data != '0x') {
        console.log("hoge");
        changeTokenBalance(receipt.to);//バランスの変更
      }
      let account = web3.eth.accounts.privateKeyToAccount(document.querySelector('#yourPrivateKey td').textContent);
      importAccount(account);
      resetTX();
      $('#sendTxModal').modal('hide')
    })
    .on('error', function(error){
      alert(error)
    });
})

document.getElementById('saveToken20').addEventListener('click', function(){
  const contractAddress = document.getElementById('token20ContractAddress').value;
  const symbol = document.getElementById('token20Symbol').value;
  const decimals = document.getElementById('decimals').value;
  const address = document.querySelector('#yourAddress td').textContent;

  erc20Contract.options.address = contractAddress;
  erc20Contract.methods.balanceOf(address).call().then((value) => {
    const tr = document.createElement('tr');
    tr.setAttribute('contractAddress', contractAddress);
    tr.setAttribute('decimals', decimals);
    tr.setAttribute('id', symbol);
    const tdBalance = document.createElement('td');
    const tdSymbol = document.createElement('td');
    const tdType = document.createElement('td');

    tdBalance.textContent = value/(10**decimals);
    tdSymbol.textContent = symbol;
    tdType.textContent = "ERC20";

    tr.appendChild(tdBalance);
    tr.appendChild(tdSymbol);
    tr.appendChild(tdType);

    document.getElementById('tokenBalanceBody').appendChild(tr);

    const newUnit = document.createElement('a');
    newUnit.classList.add('dropdown-item');
    newUnit.setAttribute('value', symbol);
    newUnit.textContent = symbol;
    newUnit.addEventListener('click', changeUnit);

    document.querySelector('.dropdown-menu').appendChild(newUnit);
  });
})

document.querySelector('.dropdown-item').addEventListener('click', changeUnit);

document.getElementById('saveToken721').addEventListener('click', function(){
  const contractAddress = document.getElementById('token721ContractAddress').value;
  const symbol = document.getElementById('token721Symbol').value;
  const accountAddress = document.querySelector('#yourAddress td').textContent;

  erc721Contract.options.address = contractAddress;
  erc721Contract.methods.balanceOf(accountAddress).call().then((value) => {
    const tr = document.createElement('tr');
    tr.setAttribute('contractAddress', contractAddress);
    tr.setAttribute('id', symbol);
    const tdBalance = document.createElement('td');
    const tdSymbol = document.createElement('td');
    const tdType = document.createElement('td');

    tdBalance.textContent = value;
    tdSymbol.textContent = symbol;
    tdType.textContent = "ERC721";

    tr.appendChild(tdBalance);
    tr.appendChild(tdSymbol);
    tr.appendChild(tdType);

    document.getElementById('tokenBalanceBody').appendChild(tr);

    for (let i = 0; i < value; i++) {
      erc721Contract.methods.tokenOfOwnerByIndex(accountAddress, i).call().then((tokenId) => {
        erc721Contract.methods.tokenURI(tokenId).call().then((uri) => {
          var request = new XMLHttpRequest();
          request.open('GET', uri);
          request.responseType = 'json';
          request.send();
          request.onload = function() {
            //TODO:これだと複数の場合活用できない。
            const card = "<div class='col-sm-4' contractAddress='" + contractAddress + "' tokenId='" + tokenId + "'>" +
                         "<div class='card'>" +
                         "<img src='" + request.response.image + "' class='card-img-top' alt='...'>" +
                         "<div class='card-body'>" +
                         "<p class='card-title'>" + request.response.name + "</p>" +
                         "<div class='form-group'>" +
                         "<input type='text' class='form-control' placeholder='e.g:0x1ed3...'>" +
                         "</div>" +
                         "<button type='submit' class='btn btn-primary btn-block transfer' onclick='transferERC721(this)'>Transfer</button>" +
                         "</div>" +
                         "</div>"
            document.querySelector('#viewERC721 .row').innerHTML = card;
          }
        })
      })
    }
  })

})

for (let i = 0; i < tokenTabs.length; i++) {
  tokenTabs[i].addEventListener('click', function(){
    for (let j = 0; j < saveTokenForms.length; j++) {
      if (i === j) {
        saveTokenForms[j].style.display = "block";
      } else {
        saveTokenForms[j].style.display = "none";
      }
    }
  })
}

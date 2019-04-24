//タブの切り替え
function changeTabs(){
  for (let i = 0; i < headTabs.length; i++) {
    headTabs[i].addEventListener('click', function(){
      for (let j = 0; j < headTabs.length; j++) {
        headTabs[j].classList.remove('active')
      }
      headTabs[i].classList.add('active');
      if (i === 0) {
        document.getElementById('createAccount').style.display = 'none';
        importAccountSection.style.display = 'block';
        viewWalletSection.style.display = 'none';
        sendETHSection.style.display = 'none';
        viewERC721Section.style.display = 'none';
        customTokenSection.style.display = 'none';
      } else {
        document.getElementById('createAccount').style.display = 'block';
        importAccountSection.style.display = 'none';
        viewWalletSection.style.display = 'none';
        sendETHSection.style.display = 'none';
        viewERC721Section.style.display = 'none';
        customTokenSection.style.display = 'none';
      }
      resetForm();
    }, false);
  }
}

//アカウントのインポート
function importAccount(account){
  document.querySelector('#yourAddress td').textContent = account.address;
  //privateKeyを表示
  document.querySelector('#yourPrivateKey td').textContent = account.privateKey;
  //balanceを変更
  web3.eth.getBalance(account.address).then((balance) => {
    document.querySelector('#yourBalance td').textContent = web3.utils.fromWei(balance, 'ether');

    let strong = document.createElement('strong');
    strong.textContent = 'ETH'
    document.querySelector('#yourBalance td').appendChild(strong);
  })
}

//フォームのリセット
function resetForm(){
  cards[0].style.display = 'block';
  cards[1].style.display = 'none';
  cards[2].style.display = 'none';

  for (var i = 0; i < inputTags.length; i++) {
    inputTags[i].value = '';
  }

  for (var i = 0; i < textareaTags.length; i++) {
    textareaTags[i].value = '';
  }

  for (var i = 0; i < tdTags.length; i++) {
    tdTags[i].textContent = '';
  }

  downloadTag.removeAttribute('href');
}

function resetTX(){
  document.getElementById('rawTransaction').textContent = '';
  document.getElementById('signedTransaction').textContent = '';
}

function changeUnit(){
  const unit = document.querySelector('.dropdown-toggle');
  unit.textContent = this.textContent;
}

async function changeTokenBalance(contractAddress){
  console.log("hoge");
  console.log(contractAddress);
  erc20Contract.options.address = contractAddress;
  let owner = document.querySelector('#yourAddress td').textContent;

  let tokens = document.querySelectorAll('#tokenBalanceBody tr');
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].getAttribute('contractAddress') == contractAddress) {
      erc20Contract.methods.balanceOf(owner).call().then((value) => {
        let decimals = tokens[i].getAttribute('decimals');
        tokens[i].firstChild.textContent = value/(10 ** decimals);
      })
    }
  }
}

async function transferERC721(button) {
  $('#sendTxModal').modal('show')
  const contractAddress = button.parentNode.parentNode.parentNode.getAttribute('contractAddress');
  const tokenId = button.parentNode.parentNode.parentNode.getAttribute('tokenId');
  const accountAddress = document.querySelector('#yourAddress td').textContent;
  const toAddress = button.previousSibling.firstChild.value;

  erc721Contract.options.address = contractAddress;
  const nonce = await web3.eth.getTransactionCount(accountAddress);
  const gasPrice = await web3.eth.getGasPrice();
  const gasLimit = await erc721Contract.methods.transferFrom(accountAddress, toAddress, tokenId).estimateGas({from: accountAddress})
    .then((gasAmount) => {
      return gasAmount + 10000;
    })
  const data = erc721Contract.methods.transferFrom(accountAddress, toAddress, tokenId).encodeABI();

  let rawTransaction = {
          nonce: web3.utils.toHex(nonce),
          gasPrice: web3.utils.toHex(gasPrice),
          gasLimit: web3.utils.toHex(gasLimit),
          to: contractAddress,
          data: data
        };
  console.log(rawTransaction);

  let transaction =  new ethereumjs.Tx(rawTransaction);
  let privateKey = document.querySelector('#yourPrivateKey td').textContent;
  privateKey = new ethereumjs.Buffer.Buffer(privateKey.substr(2), 'hex');
  transaction.sign(privateKey);
  let serializeTx = transaction.serialize();
  let signedTransaction = '0x' + serializeTx.toString('hex');
  console.log(signedTransaction);

  web3.eth.sendSignedTransaction(signedTransaction)
    .on('transactionHash', function(hash){
      console.log(hash);
    })
    .on('receipt', function(receipt){
      console.log(receipt);
      //tokenBalance調整
      change721TokenBalance(contractAddress, accountAddress);
      let account = web3.eth.accounts.privateKeyToAccount(document.querySelector('#yourPrivateKey td').textContent);
      importAccount(account);
      $('#sendTxModal').modal('hide')
    })
    .on('error', function(error){
      alert(error)
    });
}

async function change721TokenBalance(contractAddress, owner){
  document.querySelector('#viewERC721 .row').innerHTML = "";
  let tokens = document.querySelectorAll('#tokenBalanceBody tr');
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].getAttribute('contractAddress') == contractAddress) {
      erc721Contract.methods.balanceOf(owner).call().then((value) => {
        tokens[i].firstChild.textContent = value;
        for (let i = 0; i < value; i++) {
          erc721Contract.methods.tokenOfOwnerByIndex(accountAddress, i).call().then((tokenId) => {
            erc721Contract.methods.tokenURI(tokenId).call().then((uri) => {
              var request = new XMLHttpRequest();
              request.open('GET', uri);
              request.responseType = 'json';
              request.send();
              request.onload = function() {
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
    }
  }
}

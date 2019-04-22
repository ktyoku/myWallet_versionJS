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
      } else {
        document.getElementById('createAccount').style.display = 'block';
        importAccountSection.style.display = 'none';
        viewWalletSection.style.display = 'none';
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

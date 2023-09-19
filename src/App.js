import 'swiper/css';
import 'swiper/css/navigation';
import './App.css';
import connectButtonLogo from './images/connect-button-logo.png';
import { useEffect, useState } from 'react';
import { Container, Row, Col, Button} from 'react-bootstrap';
import Web3Modal from 'web3modal';
import Web3 from 'web3'
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { providerOptions } from './components/TopNavBar';
import FLIP_ABI from './abi/FLIP_ABI.json';
import GAME_ABI from './abi/GAME_ABI.json';
import { FLIP_CONTRACT, GAME_CONTRACT } from './data/contracts';
import { TopNavBar, getAllData } from './components/TopNavBar';
// import { Footer } from './components/Footer';
import backgroundImage from './images/BG.png';


const containerStyle = {
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: 'cover',

  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column'
};

function App() {


  const web3Modal = new Web3Modal({
    cacheProvider: true, // optional
    providerOptions, // required
  });

  const [mainData, setMainData] = useState({
    totalBeans: 0,
  });

  
  const getMainDataContract = async () => {
   
    const web3 = new Web3('https://rpc.pulsechain.com');
    const FLIP = new web3.eth.Contract(FLIP_ABI, FLIP_CONTRACT);
    const GAME = new web3.eth.Contract(GAME_ABI, GAME_CONTRACT)
    const totalBeans = await FLIP.methods.totalSupply().call();

    setMainData({ totalBeans });
  }

    // need add Types
    const [gameData, setGameData] = useState(null);
    const [inputBetAmount, setInputBetAmount] = useState('');
    const [inputChoice, setInputChoice] = useState('');
    const [loading, setLoading] = useState(false);
  
    useEffect(() => {
      extractGameDataFromLink();
    }, []);
  
    const extractGameDataFromLink = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const betAmount = urlParams.get('betAmount');
      const choice = urlParams.get('choice');
      const gameId = urlParams.get('gameId');
  
      if (betAmount && choice && gameId) {
        setGameData({ betAmount, choice, gameId });
      }
    };
    const [gameConfirmed, setGameConfirmed] = useState(false); 

    const confirmGame = async () => {
      if (!gameData) {
        alert('Please input valid game data.');
        return;
      }
  
      setLoading(true);

    const web3Modal = new Web3Modal({
      cacheProvider: true, // optional
      providerOptions, // required
    });
    const provider = await web3Modal.connect();
    const web3 = new Web3(provider);

    const library = new ethers.providers.Web3Provider(provider);
    const accounts = await library.listAccounts();

    const FLIP = new web3.eth.Contract(FLIP_ABI, FLIP_CONTRACT);
    const GAME = new web3.eth.Contract(GAME_ABI, GAME_CONTRACT);

    let betAmount = gameData ? gameData.betAmount : inputBetAmount;
    const weiAmount = web3.utils.toWei(betAmount.toString(), 'ether');
    betAmount = weiAmount;
    const choice = gameData ? gameData.choice : inputChoice;
    const gameId = gameData ? gameData.gameId : Date.now().toString();

    await FLIP.methods.approve(GAME_CONTRACT,betAmount).send({
      from: accounts[0],
    })
    .on('transactionHash', (hash) => {
      console.log(hash);
    })
    .on('receipt', (receipt) => {
      console.log(receipt);
      toast.success('Approved! Please Confirm!');
      getAllData();

    })
    .on('confirmation', (confirmationNumber, receipt) => {
      console.log(confirmationNumber, receipt);
    })
    .on('error', (error) => {
      toast.error('Insufficient Token Balance!');
      console.log(error);
    })

    await GAME.methods.playCoinFlip(choice, betAmount, gameId).send({
      from: accounts[0],
    })
    .on('transactionHash', (hash) => {
      console.log(hash);
    })
    .on('receipt', (receipt) => {
      console.log(receipt);
      toast.success('Confirmed! Check the bot for Results!');
      getAllData();

    })
    .on('confirmation', (confirmationNumber, receipt) => {
      console.log(confirmationNumber, receipt);
    })
    .on('error', (error) => {
      toast.error('Invalid or Expired Game Data!');
      console.log(error);
    })
    setLoading(false);
    setGameConfirmed(true);
  }


  const getAllData = () => {
    getMainDataContract();
  };

  useEffect(() => {
    getMainDataContract();
  }, []);

  const checkBot = () => {
    window.open('https://telegram.me/scoobylocker_bot');
  };

  return (
    <>
      <div style={containerStyle}>
        <div>
          <div className='card'>
            <TopNavBar {...{ connectButtonLogo, getAllData }} />

            <h1>FlipCoin Game</h1>
            <img src='https://res.cloudinary.com/autodapp/image/upload/v1695092556/flipcoin_1_cp8jtv.png' height="150" weight="150" alt='logo' />
            <p>Bet Amount: {gameData?.betAmount}</p>
            <p>Choice: {gameData?.choice}</p>
            {gameConfirmed ? (
              <div className='button-space btn-effect btn-animated'>
                <button onClick={checkBot}>Check Bot</button>
              </div>
            ) : (
              <div className='button-space btn-effect btn-animated'>
                <button variant='primary' onClick={confirmGame} disabled={loading}>
                  {loading ? 'Flipping...' : 'Confirm'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div class='footer'>
      </div>
    </>
  );
}

export default App;

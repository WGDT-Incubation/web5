import {
  ENCRYPTION_PASSWORD,
  PRIVATE_KEY_ENCRYPTION_STRING,
  CORE_NETWORK_URL,
  CORE_CHAIN_ID,
  ETHEREUM_NETWORK_URL,
  ETHEREUM_CHAIN_ID,
  POLYGON_NETWORK_URL,
  POLYGON_CHAIN_ID,
  BNB_NETWORK_URL,
  BNB_CHAIN_ID,
  AGGREGATOR_API_BASE,
  CORE_SUFIX,
  ETHEREUM_SUFFIX,
  POLYGON_SUFIX,
  BNB_SUFIX,
  API_URL
} from '@env';

const config = {
  apiUrl:API_URL,
  encryptionPassword: ENCRYPTION_PASSWORD,
  privateKeyEncryptionString: PRIVATE_KEY_ENCRYPTION_STRING,
  swapApi: AGGREGATOR_API_BASE,
  network: [
    {
      name: 'Core',
      networkurl: CORE_NETWORK_URL,
      chainId: CORE_CHAIN_ID,
      suffix: CORE_SUFIX
    },
  //   {
  //     name: 'Ethereum',
  //     networkurl: ETHEREUM_NETWORK_URL,
  //     chainId: ETHEREUM_CHAIN_ID,
  //     suffix: ETHEREUM_SUFFIX
  //   },
  //   {
  //     name: 'Polygon',
  //     networkurl: POLYGON_NETWORK_URL,
  //     chainId: POLYGON_CHAIN_ID,
  //     suffix: POLYGON_SUFIX

  //   },
  //   {
  //     name: 'BNB',
  //     networkurl: BNB_NETWORK_URL,
  //     chainId: BNB_CHAIN_ID,
  //     suffix: BNB_SUFIX
  //   },
   ],
};

export default config;
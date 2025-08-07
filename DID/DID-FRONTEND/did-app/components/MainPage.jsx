import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Dimensions,
  Animated,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {WebView} from 'react-native-webview';
import Feather from 'react-native-vector-icons/Feather';
import RNFS from 'react-native-fs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import config from '../config/config';
import MenuBar from '../assets/images/menu_bar.svg';
import ModalIcon from '../assets/images/modal_icon.svg';
import Search from '../assets/images/search.svg';
import {BlurView} from '@react-native-community/blur';
import {useNavigation} from '@react-navigation/native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import RNSecureStorage from 'rn-secure-storage';
import * as Keychain from 'react-native-keychain';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
// import notifee from '@notifee/react-native';
import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import FileViewer from 'react-native-file-viewer';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function MainPage({route}) {
  const navigate = useNavigation();
  const [number, setNumber] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [blockChainToken, setBlockChainToken] = useState('');

  const apiIp = config.apiUrl;
  const navigation = useNavigation();
  const [userData, setUserData] = useState([]);
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-SCREEN_WIDTH));
  const [checkedItems, setCheckedItems] = useState({});
  const [modal, setModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [name, setName] = useState('User');
  const [searchTerm, setSearchTerm] = useState('');
  const [emailModal, setEmailModal] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [allEmails, setAllEmails] = useState([]);

  console.log('blockChainToken Main Page===', blockChainToken);
  console.log('authToken Main Page===', authToken);

  console.log('number  ===', number);

  useEffect(() => {
    const syncAuth = async () => {
      try {
        if (
          route.params?.number &&
          route.params?.blockChainToken &&
          route.params?.authToken
        ) {
          await RNSecureStorage.setItem('number', route.params.number);
          await RNSecureStorage.setItem('authToken', route.params.authToken);
          await RNSecureStorage.setItem(
            'blockChainToken',
            route.params.blockChainToken,
          );

          setNumber(route.params.number);
          setAuthToken(route.params.authToken);
          setBlockChainToken(route.params.blockChainToken);
        } else {
          const [storedNum, storedAuthTok, storedBlockTok] = await Promise.all([
            RNSecureStorage.getItem('number'),
            RNSecureStorage.getItem('authToken'),
            RNSecureStorage.getItem('blockChainToken'),
          ]);
          if (storedAuthTok) setAuthToken(storedAuthTok);
          if (storedBlockTok) setBlockChainToken(storedBlockTok);
        }
      } catch (e) {
        console.warn('Secure-storage sync failed', e);
      }
    };

    syncAuth();
  }, [route.params]);

  // useEffect(() => {
  //   // If number or token is not yet available, skip the effect entirely.
  //   if (!number || !authToken || !blockChainToken) {
  //     return;
  //   }

  //   let isMounted = true; // track whether component is still mounted

  //   // Helper to convert a string to Title Case
  //   const toTitleCase = str => {
  //     if (!str || typeof str !== 'string') return '';
  //     return str
  //       .replace(/([a-z])([A-Z])/g, '$1 $2')
  //       .split(' ')
  //       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  //       .join(' ');
  //   };

  //   const getData = async () => {
  //     try {
  //       setLoading(true);

  //       const identityRes = await fetch(`${apiIp}user/getIdentity`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${blockChainToken}`,
  //         },
  //         body: JSON.stringify({phoneNumber: number}),
  //       });

  //       const identityJson = await identityRes.json();
  //       console.log('identityJson====>>>', identityJson);

  //       const dids = identityJson?.response?.dids || {};
  //       console.log('dids====>>>', dids);

  //       const certHtmls = await Promise.all(
  //         Object.entries(dids).map(async ([didKey, cert]) => {
  //           if (!cert || cert.isRevoked) return null;

  //           const templateId = cert.templateId;
  //           if (!templateId) return null;

  //           // Step 1: Fetch template keys
  //           const templateRes = await fetch(
  //             `${apiIp}certificate/getCertificate`,
  //             {
  //               method: 'POST',
  //               headers: {'Content-Type': 'application/json'},
  //               body: JSON.stringify({id: templateId}),
  //             },
  //           );
  //           console.log('templateRes====>>>', templateRes);
  //           if (!templateRes.ok) {
  //             console.warn(`Could not fetch template keys for ${templateId}`);
  //             return null;
  //           }

  //           const templateJson = await templateRes.json();
  //           console.log('templateJson ====>>>', templateJson);
  //           const keys = templateJson?.data?.params || [];
  //           // console.log('keys ====>>>',keys)

  //           console.log('keys ====>>>', keys);

  //           // Step 2: Build body for getCustomCertificate
  //           const certBody = {id: templateId, did: didKey};
  //           console.log('did key ===>>>>>>>>>>>>>>', certBody);
  //           keys.forEach(({param}) => {
  //             certBody[param] = cert[param] ?? '';
  //           });

  //           // Step 3: Fetch custom certificate HTML
  //           const customCertRes = await fetch(
  //             `${apiIp}certificate/getCustomCertificate`,
  //             {
  //               method: 'POST',
  //               headers: {'Content-Type': 'application/json'},
  //               body: JSON.stringify(certBody),
  //             },
  //           );

  //           if (!customCertRes.ok) {
  //             console.warn(
  //               `Failed to get custom certificate for DID ${didKey}`,
  //             );
  //             return null;
  //           }
  //           const certHtmlJson = await customCertRes.json(); // ✅ use .json()
  //           const html = certHtmlJson.data; // ✅ access `data` from parsed JSON

  //           // Format name + certificate type for UI
  //           const formattedName =
  //             cert.name ||
  //             cert.applicantName ||
  //             cert.studentName ||
  //             cert.members?.[0]?.name ||
  //             '' ||
  //             '';
  //           setName(formattedName || 'User');

  //           const formatCertType = (type = '') =>
  //             type
  //               .replace(/[_\-]+/g, ' ') // Replace `_` or `-` with space
  //               .replace(/\s+/g, ' ') // Remove extra spaces
  //               .trim()
  //               .split(' ')
  //               .map(
  //                 word =>
  //                   word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  //               )
  //               .join(' ');

  //           const formattedCertType = formatCertType(cert.certificateType);
  //           console.log('did inside at end ===>>', didKey);
  //           return {
  //             html,
  //             name: formattedName,
  //             certType: formattedCertType,
  //             did: didKey,
  //           };
  //         }),
  //       );

  //       const validCerts = certHtmls.filter(c => c !== null);
  //       setUserData(validCerts);
  //       console.log('USer Dat ainsiide useeffect ===>>>', validCerts);
  //       setLoading(false);
  //     } catch (err) {
  //       console.error('Error getting identity or certificates:', err);
  //       Alert.alert('Error', 'Could not load certificates.');
  //       setLoading(false);
  //     }
  //   };
  //   getData();
  // }, [number, authToken, blockChainToken]);
  // useEffect(() => {
  //   if (!number || !authToken || !blockChainToken) return;
  //   let isMounted = true;

  //   const getData = async () => {
  //     try {
  //       setLoading(true);

  //       // 1) fetch identity
  //       const identityRes = await fetch(`${apiIp}user/getIdentity`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${blockChainToken}`,
  //         },
  //         body: JSON.stringify({phoneNumber: number}),
  //       });
  //       const identityJson = await identityRes.json();
  //       console.log('identityJson ===>>>', identityJson);
  //       const dids = identityJson?.response?.dids || {};
  //       console.log('dids ===>>>', dids);

  //       // 2) for each DID fetch certificate
  //       const certs = await Promise.all(
  //         Object.entries(dids).map(async ([didKey, cert]) => {
  //           if (!cert || cert.isRevoked) return null;
  //           const templateId = cert.templateId;
  //           console.log('templateId ===>>>', templateId);
  //           if (!templateId) {
  //             console.error('No templateId found');
  //             setError('No templateId found');
  //             return;
  //           }

  //           // a) fetch template params
  //           const templateRes = await fetch(
  //             `${apiIp}certificate/getCertificate`,
  //             {
  //               method: 'POST',
  //               headers: {'Content-Type': 'application/json'},
  //               body: JSON.stringify({id: templateId}),
  //             },
  //           );
  //           if (!templateRes.ok) {
  //             console.error('No templateRes founded');
  //             setError('No templateRes founded');
  //             return;
  //           }
  //           const templateJson = await templateRes.json();
  //           console.log('templateJson ===>>', templateJson);
  //           const keys = templateJson.data.params || [];

  //           // b) build certBody—skip “did” here
  //           const certBody = {id: templateId};
  //           keys.forEach(({param}) => {
  //             if (param !== 'did') {
  //               certBody[param] = cert[param] ?? '';
  //             }
  //           });
  //           // finally inject the actual DID
  //           certBody.did = didKey;

  //           // c) fetch the actual HTML
  //           const customCertRes = await fetch(
  //             `${apiIp}certificate/getCustomCertificate`,
  //             {
  //               method: 'POST',
  //               headers: {'Content-Type': 'application/json'},
  //               body: JSON.stringify(certBody),
  //             },
  //           );
  //           if (!customCertRes.ok) return null;
  //           const {data: html} = await customCertRes.json();
  //           console.log('customCertRes ===>>>', customCertRes);

  //           // d) inject the did into the QR code URL
  //           const htmlWithQR = html.replace(
  //             /src="https:\/\/api\.qrserver\.com\/v1\/create-qr-code\/\?data=[^"]*"/,
  //             `src="https://api.qrserver.com/v1/create-qr-code/?data=${didKey}&size=100x100"`,
  //           );

  //           // e) format name + certType
  //           const formattedName =
  //             cert.name ||
  //             cert.applicantName ||
  //             cert.studentName ||
  //             cert.members?.[0]?.name ||
  //             '';

  //           const formattedCertType = (cert.certificateType || '')
  //             .replace(/[_\-]+/g, ' ')
  //             .replace(/\s+/g, ' ')
  //             .trim()
  //             .split(' ')
  //             .map(w => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
  //             .join(' ');

  //           return {
  //             html: htmlWithQR,
  //             name: formattedName,
  //             certType: formattedCertType,
  //             did: didKey,
  //           };
  //         }),
  //       );

  //       // 3) store only non-null certs
  //       const validCerts = certs.filter(Boolean);
  //       if (isMounted) {
  //         setUserData(validCerts);
  //         setLoading(false);
  //       }
  //     } catch (err) {
  //       console.error('Error getting identity or certificates:', err);
  //       Alert.alert('Error', 'Could not load certificates.');
  //       setLoading(false);
  //       setError('Could not load certificates.');
  //     }
  //   };

  //   getData();
  //   return () => {
  //     isMounted = false;
  //   };
  // }, [number, authToken, blockChainToken, navigation]);
  // useEffect(() => {
  //   if (!number || !authToken || !blockChainToken) return;
  //   let isMounted = true;

  //   const getData = async () => {
  //     try {
  //       setLoading(true);
  //       setError(false); // reset any previous “global” error
  //       setUserData([]); // clear old data

  //       // 1) fetch identity
  //       const identityRes = await fetch(`${apiIp}user/getIdentity`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${blockChainToken}`,
  //         },
  //         body: JSON.stringify({phoneNumber: number}),
  //       });
  //       const identityJson = await identityRes.json();
  //       const dids = identityJson?.response?.dids || {};
  //       console.log('dids==>>>', dids);
  //       // 2) fetch each cert in parallel, but wrap each in its own try/catch
  //       const certs = await Promise.all(
  //         Object.entries(dids).map(async ([didKey, cert]) => {
  //           try {
  //             if (!cert || cert.isRevoked) return null;
  //             const templateId = cert.templateId;
  //             if (!templateId) {
  //               console.error('No Template Id Found');
  //               return;
  //             }

  //             // a) get template params
  //             const tplRes = await fetch(`${apiIp}certificate/getCertificate`, {
  //               method: 'POST',
  //               headers: {'Content-Type': 'application/json'},
  //               body: JSON.stringify({id: templateId}),
  //             });
  //             if (!tplRes.ok) return null;
  //             const tplJson = await tplRes.json();
  //             const keys = tplJson.data.params || [];

  //             // b) build payload
  //             const body = keys.reduce(
  //               (acc, {param}) => ({
  //                 ...acc,
  //                 [param]: cert[param] ?? '',
  //               }),
  //               {id: templateId, did: didKey},
  //             );

  //             // c) get custom HTML
  //             const customRes = await fetch(
  //               `${apiIp}certificate/getCustomCertificate`,
  //               {
  //                 method: 'POST',
  //                 headers: {'Content-Type': 'application/json'},
  //                 body: JSON.stringify(body),
  //               },
  //             );
  //             if (!customRes.ok) {
  //               console.error('No Custom Res Id Found');
  //               return;
  //             }
  //             const {data: html} = await customRes.json();

  //             // d) format display data
  //             const name =
  //               cert.name ||
  //               cert.applicantName ||
  //               cert.studentName ||
  //               cert.members?.[0]?.name ||
  //               '';
  //             const certType = (cert.certificateType || '')
  //               .replace(/[_\-]+/g, ' ')
  //               .trim()
  //               .split(' ')
  //               .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  //               .join(' ');

  //             return {html, name, certType, did: didKey};
  //           } catch (innerErr) {
  //             console.warn(
  //               `Certificate fetch failed for DID ${didKey}:`,
  //               innerErr,
  //             );
  //             return null;
  //           }
  //         }),
  //       );

  //       // only keep the successful ones
  //       const validCerts = certs.filter(Boolean);
  //       if (isMounted) {
  //         setUserData(validCerts);
  //       }
  //     } catch (err) {
  //       console.error('Global error fetching certificates:', err);
  //       setError('Could not Fetch for Certificates');
  //       if (isMounted) setError(true);
  //     } finally {
  //       if (isMounted) setLoading(false);
  //     }
  //   };

  //   getData();
  //   return () => {
  //     isMounted = false;
  //   };
  // }, [number, authToken, blockChainToken, navigation]);

  // console.log('name - main page====>>>', name);
  // useEffect(() => {
  //   if (!number || !authToken || !blockChainToken) return;
  //   let isMounted = true;

  //   const getData = async () => {
  //     try {
  //       setLoading(true);
  //       setError(false);
  //       setUserData([]);

  //       // 1) fetch identity
  //       const identityRes = await fetch(`${apiIp}user/getIdentity`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${blockChainToken}`,
  //         },
  //         body: JSON.stringify({ phoneNumber: number }),
  //       });
  //       const { response } = await identityRes.json();
  //       const dids = response?.dids || {};
  //       console.log('dids ===>>>',dids)

  //       // 2) fetch all templates once
  //       const allTplRes = await fetch(`${apiIp}certificate/getAllCertificates`);
  //       const { data: allTemplates } = await allTplRes.json();
  //       // build a lookup: lowercase type → templateId
  //       const templateMap = allTemplates.reduce((map, tpl) => {
  //         map[tpl.name.toLowerCase()] = tpl.id;
  //         return map;
  //       }, {});

  //       // 3) fetch each cert in parallel
  //       const certs = await Promise.all(
  //         Object.entries(dids).map(async ([didKey, cert]) => {
  //           try {
  //             if (!cert || cert.isRevoked) return null;

  //             // fallback to lookup if missing
  //             const rawType = (cert.certificateType || '').toLowerCase();
  //             const templateId =
  //               cert.templateId ||
  //               templateMap[rawType] ||
  //               templateMap[rawType.replace(/\s+/g, ' ')];

  //             if (!templateId) {
  //               console.warn(`No templateId found for type "${cert.certificateType}"`);
  //               return null;
  //             }

  //             // a) get template params
  //             const tplRes = await fetch(
  //               `${apiIp}certificate/getCertificate`, {
  //                 method: 'POST',
  //                 headers: { 'Content-Type': 'application/json' },
  //                 body: JSON.stringify({ id: templateId }),
  //               }
  //             );
  //             if (!tplRes.ok) return null;
  //             const { data: { params: keys } } = await tplRes.json();

  //             // b) build body
  //             const body = keys.reduce(
  //               (acc, { param }) => ({
  //                 ...acc,
  //                 [param]: cert[param] ?? '',
  //               }),
  //               { id: templateId, did: didKey }
  //             );

  //             // c) get custom HTML
  //             const customRes = await fetch(
  //               `${apiIp}certificate/getCustomCertificate`, {
  //                 method: 'POST',
  //                 headers: { 'Content-Type': 'application/json' },
  //                 body: JSON.stringify(body),
  //               }
  //             );
  //             if (!customRes.ok) return null;
  //             const { data: html } = await customRes.json();

  //             // d) format for UI
  //             const name =
  //               cert.name ||
  //               cert.applicantName ||
  //               cert.studentName ||
  //               cert.members?.[0]?.name ||
  //               '';
  //             const certType = rawType
  //               .replace(/[_\-]+/g, ' ')
  //               .trim()
  //               .split(' ')
  //               .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  //               .join(' ');

  //             return { html, name, certType, did: didKey };
  //           } catch (e) {
  //             console.warn(`Cert ${didKey} failed:`, e);
  //             return null;
  //           }
  //         })
  //       );

  //       const valid = certs.filter(Boolean);
  //       if (isMounted) setUserData(valid);
  //     } catch (err) {
  //       console.error('Error loading certificates:', err);
  //       if (isMounted) setError(true);
  //     } finally {
  //       if (isMounted) setLoading(false);
  //     }
  //   };

  //   getData();
  //   return () => { isMounted = false; };
  // }, [number, authToken, blockChainToken]);
  // useEffect(() => {
  //   if (!number || !authToken || !blockChainToken) return;
  //   let isMounted = true;

  //   const getData = async () => {
  //     try {
  //       setLoading(true);
  //       setError(false);
  //       setUserData([]);

  //       // 1) fetch identity
  //       const identityRes = await fetch(`${apiIp}user/getIdentity`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${blockChainToken}`,
  //         },
  //         body: JSON.stringify({ phoneNumber: number }),
  //       });
  //       const { response } = await identityRes.json();
  //       const dids = response?.dids || {};

  //       // 2) fetch all templates for non-family types
  //       const allTplRes = await fetch(`${apiIp}certificate/getAllCertificates`);
  //       const { data: allTemplates } = await allTplRes.json();
  //       const templateMap = allTemplates.reduce((map, tpl) => {
  //         map[tpl.name.toLowerCase().replace(/[\s\-_]/g, '')] = tpl.id;
  //         return map;
  //       }, {});

  //       // 3) build each cert entry
  //       const certs = await Promise.all(
  //         Object.entries(dids).map(async ([didKey, cert]) => {
  //           try {
  //             // skip revoked entirely
  //             if (!cert || cert.isRevoked) return null;

  //             const rawType = (cert.certificateType || '').trim();
  //             console.log('rawType====<>>>',rawType)

  //             // --- FAMILY CERTIFICATES: raw data, no template fetch ---
  //             if (rawType.toLowerCase() === 'familycertificate') {
  //               return {
  //                 isFamily: true,
  //                 familyDetail: cert,            // send full cert object
  //                 certType: 'Family Certificate',// nicely formatted
  //                 did: didKey,
  //               };
  //             }

  //             // --- ALL OTHER TYPES: fallback lookup & template fetch ---
  //             //  a) find or match templateId
  //             const normalize = s => s.toLowerCase().replace(/[\s\-_]/g, '');
  //             let tplId = cert.templateId;
  //             if (!tplId) {
  //               // exact normalized
  //               const key = normalize(rawType);
  //               tplId = templateMap[key];
  //               // partial match
  //               if (!tplId) {
  //                 const partial = Object.entries(templateMap).find(([name]) =>
  //                   name.includes(key)
  //                 );
  //                 tplId = partial?.[1];
  //               }
  //             }
  //             if (!tplId) return null;

  //             // b) fetch params
  //             const paramsRes = await fetch(
  //               `${apiIp}certificate/getCertificate`,
  //               {
  //                 method: 'POST',
  //                 headers: { 'Content-Type': 'application/json' },
  //                 body: JSON.stringify({ id: tplId }),
  //               }
  //             );
  //             if (!paramsRes.ok) return null;
  //             const { data: { params: keys } } = await paramsRes.json();

  //             // c) build payload/body
  //             const body = keys.reduce(
  //               (acc, { param }) => ({
  //                 ...acc,
  //                 [param]: cert[param] ?? '',
  //               }),
  //               { id: tplId, did: didKey }
  //             );

  //             // d) fetch HTML
  //             const htmlRes = await fetch(
  //               `${apiIp}certificate/getCustomCertificate`,
  //               {
  //                 method: 'POST',
  //                 headers: { 'Content-Type': 'application/json' },
  //                 body: JSON.stringify(body),
  //               }
  //             );
  //             if (!htmlRes.ok) return null;
  //             const { data: html } = await htmlRes.json();

  //             // e) format display
  //             const displayName =
  //               cert.name ||
  //               cert.applicantName ||
  //               cert.studentName ||
  //               cert.members?.[0]?.name ||
  //               '';
  //             const displayType = rawType
  //               .replace(/[_\-]+/g, ' ')
  //               .split(' ')
  //               .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  //               .join(' ');

  //             return {
  //               isFamily: false,
  //               html,
  //               name: displayName,
  //               certType: displayType,
  //               did: didKey,
  //             };
  //           } catch {
  //             return null;
  //           }
  //         })
  //       );

  //       if (isMounted) {
  //         setUserData(certs.filter(Boolean));
  //       }
  //     } catch {
  //       if (isMounted) setError(true);
  //     } finally {
  //       if (isMounted) setLoading(false);
  //     }
  //   };

  //   getData();
  //   return () => {
  //     isMounted = false;
  //   };
  // }, [number, authToken, blockChainToken]);

  // useEffect(() => {
  //   if (!number || !authToken || !blockChainToken) return;
  //   let isMounted = true;

  //   const getData = async () => {
  //     try {
  //       setLoading(true);
  //       setError(false);
  //       setUserData([]);

  //       // 1) fetch identity
  //       const identityRes = await fetch(`${apiIp}user/getIdentity`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${blockChainToken}`,
  //         },
  //         body: JSON.stringify({phoneNumber: number}),
  //       });
  //       const {response} = await identityRes.json();
  //       const dids = response?.dids || {};
  //       console.log('dids ====>>>', dids);
  //       // setError('Could not load api data');
  //       const allEntries = Object.entries(dids);
  //       if (allEntries.length === 0) {
  //         setError('No certificates available for this phone number');
  //         setLoading(false);
  //         return;
  //       }

  //       // 2) fetch all templates once
  //       const allTplRes = await fetch(`${apiIp}certificate/getAllCertificates`);
  //       const {data: allTemplates} = await allTplRes.json();
  //       console.log('allTemplates ===>>>', allTemplates);
  //       const templateMap = allTemplates.reduce((map, tpl) => {
  //         map[tpl.name.toLowerCase().replace(/[\s\-_]/g, '')] = tpl.id;
  //         return map;
  //       }, {});

  //       console.log('templateMap ===>>>', templateMap);

  //       // 3) build each cert entry
  //       const certs = await Promise.all(
  //         Object.entries(dids).map(async ([didKey, cert]) => {
  //           if (!cert || cert.isRevoked) return null;

  //           const rawType = (cert.certificateType || '').trim();
  //           // const normType = rawType.toLowerCase();
  //           // if (normType === 'familycertificate') {
  //           //   const familyPayload = {
  //           //     ...cert,
  //           //     did: didKey,
  //           //     type: 'familyCertificate',
  //           //     certificateType: 'familyCertificate',
  //           //     id: null,
  //           //   };

  //           //   const familyUrl =
  //           //     apiIp.replace(/\/+$/, '') +
  //           //     '/certificate/customFamilyCertificate';

  //           //   // always read as text
  //           //   const customRes = await fetch(familyUrl, {
  //           //     method: 'POST',
  //           //     headers: {'Content-Type': 'application/json'},
  //           //     body: JSON.stringify(familyPayload),
  //           //   });
  //           //   const raw = await customRes.text();
  //           //   // console.log('customFamilyCertificate →', customRes.status, raw);

  //           //   if (!customRes.ok) return null;

  //           //   // if it’s HTML, use it directly; otherwise parse JSON
  //           //   let htmlFragment;
  //           //   if (raw.trim().startsWith('<')) {
  //           //     htmlFragment = raw;
  //           //   } else {
  //           //     try {
  //           //       const j = JSON.parse(raw);
  //           //       htmlFragment = j.data?.html ?? j.data ?? j.html ?? '';
  //           //     } catch {
  //           //       console.error('Invalid JSON from family API:', raw);
  //           //       return null;
  //           //     }
  //           //   }

  //           //   return {
  //           //     isFamily: true,
  //           //     html: htmlFragment,
  //           //     name: cert.members?.[0]?.name || 'User',
  //           //     certType: 'Family Certificate',
  //           //     did: didKey,
  //           //   };
  //           // }

  //           // —— ALL OTHER CERTIFICATES ——
  //           // find or match templateId
  //           // const normalize = s => s.toLowerCase().replace(/[\s\-_]/g, '');

  //           const normalize = (s) => s.toLowerCase().replace(/[\s\-_]/g, '');
  //           const normType = normalize(rawType);
  //           const isFamilyCert = normType.startsWith('familycertificate');

  //           if (isFamilyCert) {
  //             // build the same payload no matter which numbered variant it is
  //             const familyPayload = {
  //               ...cert,
  //               did: didKey,
  //               type: 'familyCertificate',
  //               certificateType: 'familyCertificate',
  //               id: null,
  //             };

  //             const familyUrl =
  //               apiIp.replace(/\/+$/, '') +
  //               '/certificate/customFamilyCertificate';

  //             const customRes = await fetch(familyUrl, {
  //               method: 'POST',
  //               headers: {'Content-Type': 'application/json'},
  //               body: JSON.stringify(familyPayload),
  //             });
  //             if (!customRes.ok) return null;
  //             const raw = await customRes.text();

  //             let htmlFragment;
  //             if (raw.trim().startsWith('<')) {
  //               htmlFragment = raw;
  //             } else {
  //               try {
  //                 const j = JSON.parse(raw);
  //                 htmlFragment = j.data?.html ?? j.data ?? j.html ?? '';
  //               } catch {
  //                 console.error('Invalid JSON from family API:', raw);
  //                 return null;
  //               }
  //             }

  //             return {
  //               isFamily: true,
  //               html: htmlFragment,
  //               name: cert.members?.[0]?.name || 'User',
  //               certType: 'Family Certificate',
  //               did: didKey,
  //             };
  //           }

  //           let tplId = cert.templateId;
  //           if (!tplId) {
  //             const key = normalize(rawType);
  //             tplId =
  //               templateMap[key] ||
  //               Object.entries(templateMap).find(([name]) =>
  //                 name.includes(key),
  //               )?.[1];
  //           }
  //           if (!tplId) return null;

  //           // fetch params
  //           const paramsRes = await fetch(
  //             `${apiIp}certificate/getCertificate`,
  //             {
  //               method: 'POST',
  //               headers: {'Content-Type': 'application/json'},
  //               body: JSON.stringify({id: tplId}),
  //             },
  //           );
  //           if (!paramsRes.ok) return null;
  //           const {
  //             data: {params: keys},
  //           } = await paramsRes.json();

  //           // build body
  //           const body = keys.reduce(
  //             (acc, {param}) => {
  //               acc[param] = cert[param] || '';
  //               return acc;
  //             },
  //             {id: tplId, did: didKey},
  //           );

  //           // fetch HTML
  //           const htmlRes = await fetch(
  //             `${apiIp}certificate/getCustomCertificate`,
  //             {
  //               method: 'POST',
  //               headers: {'Content-Type': 'application/json'},
  //               body: JSON.stringify(body),
  //             },
  //           );
  //           if (!htmlRes.ok) return null;
  //           const {data: html} = await htmlRes.json();

  //           // format display
  //           const displayName =
  //             cert.name ||
  //             cert.applicantName ||
  //             cert.studentName ||
  //             cert.members?.[0]?.name ||
  //             '';
  //           const displayType = rawType
  //             .replace(/[_\-]+/g, ' ')
  //             .split(' ')
  //             .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  //             .join(' ');

  //           return {
  //             isFamily: false,
  //             html,
  //             name: displayName || 'User',
  //             certType: displayType,
  //             did: didKey,
  //           };
  //         }),
  //       );

  //       if (isMounted) {
  //         setUserData(certs.filter(Boolean));
  //       }
  //     } catch (e) {
  //       setError('Could not load api data');
  //       console.error('getData error', e);
  //       if (isMounted) setError(true);
  //     } finally {
  //       if (isMounted) setLoading(false);
  //     }
  //   };

  //   getData();
  //   return () => {
  //     isMounted = false;
  //   };
  // }, [number, authToken, blockChainToken]);

  //   useEffect(() => {
  //   if (!number || !authToken || !blockChainToken) return;
  //   let isMounted = true;

  //   const getData = async () => {
  //     try {
  //       setLoading(true);
  //       setError(false);
  //       setUserData([]);

  //       // 1. Get identity
  //       const identityRes = await fetch(`${apiIp}user/getIdentity`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${blockChainToken}`,
  //         },
  //         body: JSON.stringify({ phoneNumber: number }),
  //       });

  //       const { response } = await identityRes.json();
  //       const dids = response?.dids || {};
  //       if (!Object.keys(dids).length) {
  //         setError('No certificates available for this phone number');
  //         setLoading(false);
  //         return;
  //       }

  //       // 2. Get template map
  //       const tplRes = await fetch(`${apiIp}certificate/getAllCertificates`);
  //       const { data: allTemplates } = await tplRes.json();
  //       const templateMap = allTemplates.reduce((map, tpl) => {
  //         map[tpl.name.toLowerCase().replace(/[\s\-_]/g, '')] = tpl.id;
  //         return map;
  //       }, {});

  //       // 3. Iterate and process certificates
  //       const certs = await Promise.all(
  //         Object.entries(dids).map(async ([didKey, cert]) => {
  //           if (!cert || cert.isRevoked) return null;

  //           const rawType = (cert.certificateType || '').trim();
  //           const normType = rawType.toLowerCase().replace(/[\s\-_]/g, '');

  //           // Case 1: Classic "familyCertificate"
  //           if (normType === 'familycertificate') {
  //             const payload = {
  //               ...cert,
  //               did: didKey,
  //               id: null,
  //               type: 'familyCertificate',
  //               certificateType: 'familyCertificate',
  //             };

  //             const res = await fetch(`${apiIp.replace(/\/+$/, '')}/certificate/customFamilyCertificate`, {
  //               method: 'POST',
  //               headers: { 'Content-Type': 'application/json' },
  //               body: JSON.stringify(payload),
  //             });

  //             if (!res.ok) return null;
  //             const text = await res.text();
  //             const html = text.trim().startsWith('<') ? text : JSON.parse(text)?.data?.html ?? '';

  //             return {
  //               htmlType: 'customFamilyCertificate',
  //               isFamily: true,
  //               html,
  //               name: cert.members?.[0]?.name || 'User',
  //               certType: 'Family Certificate',
  //               did: didKey,
  //             };
  //           }

  //           // Case 2: All other certs including family certificate 2/3
  //           let tplId = cert.templateId;
  //           if (!tplId) {
  //             tplId = templateMap[normType] ||
  //               Object.entries(templateMap).find(([key]) => key.includes(normType))?.[1];
  //           }
  //           if (!tplId) return null;

  //           const paramsRes = await fetch(`${apiIp}certificate/getCertificate`, {
  //             method: 'POST',
  //             headers: { 'Content-Type': 'application/json' },
  //             body: JSON.stringify({ id: tplId }),
  //           });
  //           if (!paramsRes.ok) return null;

  //           const { data: certFromGet } = await paramsRes.json();
  //           const keys = certFromGet.params;
  //           const dynamicKeys = certFromGet.dynamicKeys || [];

  //           const body = { id: tplId, did: didKey };
  //           keys.forEach(({ param }) => {
  //             body[param] = cert[param] ?? '';
  //           });

  //           // Build rows from dynamic array fields if present
  //           if (dynamicKeys.length > 0) {
  //             const rowFields = dynamicKeys.map(k => k.param);
  //             body.rows = [];
  //             const rowCount = Math.max(...rowFields.map(field => (cert[field] || []).length));

  //             for (let i = 0; i < rowCount; i++) {
  //               const row = {};
  //               rowFields.forEach(field => {
  //                 row[field] = cert[field]?.[i] ?? '';
  //               });
  //               body.rows.push(row);
  //             }
  //           }

  //           // Prefer HTML from getCertificate if available
  //           let html = certFromGet.html;

  //           // Fallback: getCustomCertificate
  //           if (!html) {
  //             const htmlRes = await fetch(`${apiIp}certificate/getCustomCertificate`, {
  //               method: 'POST',
  //               headers: { 'Content-Type': 'application/json' },
  //               body: JSON.stringify(body),
  //             });
  //             if (!htmlRes.ok) return null;
  //             const { data } = await htmlRes.json();
  //             html = data;
  //           }

  //           const displayName =
  //             cert.name ||
  //             cert.applicantName ||
  //             cert.studentName ||
  //             cert.headName ||
  //             cert.members?.[0]?.name ||
  //             'User';

  //           const displayType = rawType
  //             .replace(/[_\-]+/g, ' ')
  //             .split(' ')
  //             .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  //             .join(' ');

  //           return {
  //             htmlType: 'getCertificateOrCustom',
  //             isFamily: normType.startsWith('familycertificate'),
  //             html,
  //             name: displayName,
  //             certType: displayType,
  //             did: didKey,
  //           };
  //         })
  //       );

  //       if (isMounted) {
  //         const filtered = certs.filter(Boolean);
  //         setUserData(filtered);
  //       }
  //     } catch (err) {
  //       console.error('getData error', err);
  //       if (isMounted) setError('Could not load api data');
  //     } finally {
  //       if (isMounted) setLoading(false);
  //     }
  //   };

  //   getData();
  //   return () => {
  //     isMounted = false;
  //   };
  // }, [number, authToken, blockChainToken]);

  // useEffect(() => {
  //   if (!number || !authToken || !blockChainToken) return;
  //   let isMounted = true;

  //   const getData = async () => {
  //     try {
  //       setLoading(true);
  //       setError(false);
  //       setUserData([]);

  //       // 1. Fetch identity
  //       const identityRes = await fetch(`${apiIp}user/getIdentity`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${blockChainToken}`,
  //         },
  //         body: JSON.stringify({phoneNumber: number}),
  //       });

  //       const {response} = await identityRes.json();
  //       const dids = response?.dids || {};
  //       console.log('dids ====>>>', dids);
  //       if (!Object.keys(dids).length) {
  //         setError('No certificates available for this phone number');
  //         setLoading(false);
  //         return;
  //       }

  //       // 2. Fetch all templates
  //       const tplRes = await fetch(`${apiIp}certificate/getAllCertificates`);
  //       const {data: allTemplates} = await tplRes.json();
  //       const templateMap = allTemplates.reduce((map, tpl) => {
  //         map[tpl.name.toLowerCase().replace(/[\s\-_]/g, '')] = tpl.id;
  //         return map;
  //       }, {});

  //       // 3. Process each certificate
  //       const certs = await Promise.all(
  //         Object.entries(dids).map(async ([didKey, cert]) => {
  //           if (!cert || cert.isRevoked) return null;

  //           const rawType = (cert.certificateType || '').trim();
  //           const normType = rawType.toLowerCase().replace(/[\s\-_]/g, '');

  //           // Case 1: plain familyCertificate → use /customFamilyCertificate
  //           if (normType === 'familycertificate') {
  //             const payload = {
  //               ...cert,
  //               did: didKey,
  //               id: null,
  //               type: 'familyCertificate',
  //               certificateType: 'familyCertificate',
  //             };

  //             const res = await fetch(
  //               `${apiIp.replace(
  //                 /\/+$/,
  //                 '',
  //               )}/certificate/customFamilyCertificate`,
  //               {
  //                 method: 'POST',
  //                 headers: {'Content-Type': 'application/json'},
  //                 body: JSON.stringify(payload),
  //               },
  //             );

  //             if (!res.ok) return null;
  //             const text = await res.text();
  //             const html = text.trim().startsWith('<')
  //               ? text
  //               : JSON.parse(text)?.data?.html ?? '';

  //             return {
  //               htmlType: 'customFamilyCertificate',
  //               isFamily: true,
  //               html,
  //               name: cert.members?.[0]?.name || 'User',
  //               certType: 'Family Certificate',
  //               did: didKey,
  //             };
  //           }

  //           // Case 2: all other certs → use getCertificate + getCustomCertificate
  //           let tplId = cert.templateId;
  //           if (!tplId) {
  //             tplId =
  //               templateMap[normType] ||
  //               Object.entries(templateMap).find(([key]) =>
  //                 key.includes(normType),
  //               )?.[1];
  //           }
  //           if (!tplId) return null;

  //           const paramsRes = await fetch(
  //             `${apiIp}certificate/getCertificate`,
  //             {
  //               method: 'POST',
  //               headers: {'Content-Type': 'application/json'},
  //               body: JSON.stringify({id: tplId}),
  //             },
  //           );
  //           if (!paramsRes.ok) return null;

  //           const {data: certFromGet} = await paramsRes.json();
  //           const keys = certFromGet.params || [];
  //           console.log('keys===>>>', keys);

  //           const dynamicKeys = certFromGet.dynamicKeys || [];

  //           const body = {id: tplId, did: didKey};
  //           console.log('body===>>>', body);

  //           // Add static params
  //           keys.forEach(({param}) => {
  //             body[param] = cert[param] ?? '';
  //           });

  //           // Handle dynamic array keys → rows
  //           if (dynamicKeys.length > 0) {
  //             console.log('dynamicKeys===>>>', dynamicKeys);
  //             const rowFields = dynamicKeys.map(k => k.param);
  //             body.rows = [];

  //             const rowCount = Math.max(
  //               ...rowFields.map(field => (cert[field] || []).length),
  //             );
  //             for (let i = 0; i < rowCount; i++) {
  //               const row = {};
  //               rowFields.forEach(field => {
  //                 row[field] = cert[field]?.[i] ?? '';
  //               });
  //               body.rows.push(row);
  //             }
  //           }

  //           // Always call getCustomCertificate to render with actual data
  //           const htmlRes = await fetch(
  //             `${apiIp}certificate/getCustomCertificate`,
  //             {
  //               method: 'POST',
  //               headers: {'Content-Type': 'application/json'},
  //               body: JSON.stringify(body),
  //             },
  //           );
  //           if (!htmlRes.ok) return null;

  //           const {data: html} = await htmlRes.json();

  //           const displayName =
  //             cert.name ||
  //             cert.applicantName ||
  //             cert.studentName ||
  //             cert.headName ||
  //             cert.members?.[0]?.name ||
  //             'User';

  //           const displayType = rawType
  //             .replace(/[_\-]+/g, ' ')
  //             .split(' ')
  //             .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  //             .join(' ');

  //           return {
  //             htmlType: 'getCustomCertificate',
  //             isFamily: normType.startsWith('familycertificate'),
  //             html,
  //             name: displayName,
  //             certType: displayType,
  //             did: didKey,
  //           };
  //         }),
  //       );

  //       if (isMounted) {
  //         const filtered = certs.filter(Boolean);
  //         setUserData(filtered);
  //       }
  //     } catch (err) {
  //       console.error('getData error', err);
  //       if (isMounted) setError('Could not load api data');
  //     } finally {
  //       if (isMounted) setLoading(false);
  //     }
  //   };

  //   getData();
  //   return () => {
  //     isMounted = false;
  //   };
  // }, [number, authToken, blockChainToken]);
  useEffect(() => {
    if (!number || !authToken || !blockChainToken) return;
    let isMounted = true;

    const getData = async () => {
      try {
        setLoading(true);
        setError(false);
        setUserData([]);

        // 1. Fetch identity
        const identityRes = await fetch(`${apiIp}user/getIdentity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${blockChainToken}`,
          },
          body: JSON.stringify({phoneNumber: number}),
        });
        const {response} = await identityRes.json();
        const dids = response?.dids || {};
        console.log('dids===>>>', dids);
        if (!Object.keys(dids).length) {
          setError('No certificates available for this phone number');
          setLoading(false);
          return;
        }

        // 2. Fetch all templates
        const tplRes = await fetch(`${apiIp}certificate/getAllCertificates`);
        const {data: allTemplates} = await tplRes.json();
        const templateMap = allTemplates.reduce((map, tpl) => {
          map[tpl.name.toLowerCase().replace(/[\s\-_]/g, '')] = tpl.id;
          return map;
        }, {});

        // 3. Process each certificate
        const certs = await Promise.all(
          Object.entries(dids).map(async ([didKey, cert]) => {
            if (!cert || cert.isRevoked) return null;
            const rawType = (cert.certificateType || '').trim();
            const normType = rawType.toLowerCase().replace(/[\s\-_]/g, '');

            // --- plain familyCertificate uses special endpoint ---
            // if (normType === 'familycertificate') {
            //   const payload = {
            //     ...cert,
            //     did: didKey,
            //     id: null,
            //     type: 'familyCertificate',
            //     certificateType: 'familyCertificate',
            //   };
            //   const res = await fetch(
            //     `${apiIp.replace(
            //       /\/+$/,
            //       '',
            //     )}/certificate/customFamilyCertificate`,
            //     {
            //       method: 'POST',
            //       headers: {'Content-Type': 'application/json'},
            //       body: JSON.stringify(payload),
            //     },
            //   );
            //   if (!res.ok) return null;
            //   const text = await res.text();
            //   const html = text.trim().startsWith('<')
            //     ? text
            //     : JSON.parse(text)?.data?.html ?? '';
            //   return {
            //     htmlType: 'customFamilyCertificate',
            //     isFamily: true,
            //     html,
            //     name: cert.members?.[0]?.name || 'User',
            //     certType: 'Family Certificate',
            //     did: didKey,
            //     rows: cert.members || [],
            //   };
            // }

            // --- all other certificates ---
            let tplId = cert.templateId;
            if (!tplId) {
              tplId =
                templateMap[normType] ||
                Object.entries(templateMap).find(([k]) =>
                  k.includes(normType),
                )?.[1];
            }
            if (!tplId) return null;

            // fetch params & dynamicKeys
            const paramsRes = await fetch(
              `${apiIp}certificate/getCertificate`,
              {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({id: tplId}),
              },
            );
            if (!paramsRes.ok) return null;
            const {data: certFromGet} = await paramsRes.json();
            // console.log('certFromGet ===>>>', certFromGet);
            const keys = certFromGet.params || [];
            console.log('keys ===>>>', keys);

            const dynamicKeys = certFromGet.dynamicKeys || [];

            // build request body, seeding did first
            const body = {id: tplId, did: didKey};

            // populate all static params except 'did' and 'rows'
            keys.forEach(({param}) => {
              if (param === 'did' || param === 'rows') return;
              body[param] = cert[param] ?? '';
            });

            // assemble body.rows from dynamicKeys
            // body.rows = [];
            // if (dynamicKeys.length) {
            //   const rowFields = dynamicKeys.map(k => k.param);
            //   const rowCount = Math.max(
            //     ...rowFields.map(f => (cert[f] || []).length),
            //   );
            //   for (let i = 0; i < rowCount; i++) {
            //     const row = {};
            //     rowFields.forEach(f => (row[f] = cert[f]?.[i] ?? ''));
            //     body.rows.push(row);
            //   }
            // }
            // If the cert object already has a rows array, use it directly
            if (Array.isArray(cert.rows) && cert.rows.length > 0) {
              body.rows = cert.rows;
            } else if (dynamicKeys.length > 0) {
              // fallback: only if cert.rows was missing
              const rowFields = dynamicKeys.map(k => k.param);
              const rowCount = Math.max(
                ...rowFields.map(f => (cert[f] || []).length),
              );
              body.rows = [];
              for (let i = 0; i < rowCount; i++) {
                const row = {};
                rowFields.forEach(field => {
                  row[field] = cert[field]?.[i] ?? '';
                });
                body.rows.push(row);
              }
            }

            console.log('body ===>>>', body);
            // get rendered HTML
            const htmlRes = await fetch(
              `${apiIp}certificate/getCustomCertificate`,
              {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body),
              },
            );
            if (!htmlRes.ok) return null;
            const {data: html} = await htmlRes.json();

            const displayName =
              cert.name ||
              cert.applicantName ||
              cert.studentName ||
              cert.headName ||
              cert.members?.[0]?.name ||
              'User';
            const displayType = rawType
              .replace(/[_\-]+/g, ' ')
              .split(' ')
              .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(' ');

            return {
              htmlType: 'getCustomCertificate',
              isFamily: normType.startsWith('familycertificate'),
              html,
              name: displayName,
              certType: displayType,
              did: didKey,
              rows: body.rows,
            };
          }),
        );

        if (isMounted) {
          setUserData(certs.filter(Boolean));
        }
      } catch (err) {
        console.error('getData error', err);
        if (isMounted) setError('Could not load api data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getData();
    return () => {
      isMounted = false;
    };
  }, [number, authToken, blockChainToken]);

  console.log('User Data ===>>>', userData);

  useEffect(() => {
    const getVerifierAllEmails = async () => {
      try {
        if (!authToken) {
          console.warn('No authToken found. Skipping fetch.');
          return;
        }

        const res = await fetch(`${apiIp}user/getAllVerifierEmails`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });

        console.log('Email API status:', res.status);

        if (!res.ok) {
          const errText = await res.text();
          console.warn('Failed to fetch verifier emails:', errText);
          setAllEmails([]);
          return;
        }

        const result = await res.json();
        console.log('Result for email verifier ===', result);

        const emails = Array.isArray(result.verifierEmails)
          ? result.verifierEmails
          : [];
        setAllEmails(emails);
      } catch (err) {
        console.error('Error fetching verifier emails:', err);
        setAllEmails([]);
      }
    };

    getVerifierAllEmails();
  }, [authToken]);

  console.log('Result for email outside UseEffect verifier ===', allEmails);
  const createNotificationChannel = async () => {
    await notifee.requestPermission(); // required on Android 13+

    const channelId = await notifee.createChannel({
      id: 'downloads',
      name: 'Downloads Channel',
      importance: AndroidImportance.HIGH,
    });

    console.log('Notification channel created:', channelId);
  };

  useEffect(() => {
    createNotificationChannel();
  }, []);

  const toggleCheckbox = id => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Toggle checkbox
  const toggleEmail = email => {
    setSelectedEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email],
    );
  };
  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSidebarVisible(false));
  };

  const handleOptionPress = (routeName, params) => {
    // 1) Animate sidebar closed
    closeSidebar();
    // 2) Then navigate
    navigation.navigate(routeName, params);
  };

  const isAnyChecked = Object.values(checkedItems).some(val => val === true);

  const handleQrButtonClicked = () => {
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
  };

  const closeModalEmail = () => {
    setModal(false);
    setEmailModal(false);
    setSelectedEmails([]);
  };

  const viewFullCertificate = certHtml => {
    console.log('certHtml ==>>>', certHtml);
    setSelectedCertificate(certHtml);
    setModalVisible(true);
  };
  const capitalize = name => {
    if (typeof name !== 'string' || !name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const FallbackProfileImage = name => {
    const firstLetter = capitalize(name)?.charAt(0);
  };
  const handleLogout = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Keychain.resetGenericPassword({service: 'authToken'});
        await Keychain.resetGenericPassword({service: 'blockChainToken'});
        await Keychain.resetGenericPassword({service: 'token'});
        await Keychain.resetGenericPassword({service: 'number'});
        console.log('Cleared credentials from iOS Keychain');
      } else {
        await RNSecureStorage.removeItem('authToken');
        await RNSecureStorage.removeItem('blockChainToken');
        await RNSecureStorage.removeItem('number');
        console.log('Cleared credentials from Android secure storage');
      }

      navigation.reset({
        index: 0,
        routes: [{name: 'Login'}],
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const filteredCertificates = userData.filter(cert => {
    const nameMatch = cert.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const typeMatch = cert.certType
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const didMatch = cert.did?.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || typeMatch || didMatch;
  });

  const getUniqueFileName = async (basePath, baseName) => {
    let counter = 0;
    let finalFileName = `${baseName}.pdf`;
    let fullPath = `${basePath}/${finalFileName}`;

    while (await RNFS.exists(fullPath)) {
      counter += 1;
      finalFileName = `${baseName}(${counter}).pdf`;
      fullPath = `${basePath}/${finalFileName}`;
    }

    return finalFileName;
  };

  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(async ({type, detail}) => {
      if (type === EventType.PRESS && detail.pressAction.id === 'open-pdf') {
        const filePath = detail.notification?.data?.filePath;
        if (filePath) {
          try {
            await FileViewer.open(filePath);
          } catch (err) {
            console.error('Failed to open file', err);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const generateAndSavePDF = async (htmlContent, apiFileName) => {
    try {
      if (!htmlContent || !apiFileName) {
        Alert.alert('Error', 'Missing certificate content or file name.');
        return;
      }

      await notifee.displayNotification({
        title: 'Downloading Certificate',
        body: `Starting download of ${apiFileName}.pdf`,
        android: {
          channelId: 'downloads',
          smallIcon: 'wf_logo',
        },
      });

      const pdf = await RNHTMLtoPDF.convert({
        html: htmlContent,
        fileName: apiFileName,
        directory: 'downloads',
      });

      const tempPath = pdf.filePath;
      if (!tempPath) throw new Error('PDF generation failed.');

      if (Platform.OS === 'android') {
        const downloadsPath = RNFS.DownloadDirectoryPath;
        const uniqueFileName = await getUniqueFileName(
          downloadsPath,
          apiFileName,
        );
        const finalPath = `${downloadsPath}/${uniqueFileName}`;

        await RNFS.moveFile(tempPath, finalPath);

        // Alert.alert('Certificate Downloaded Successful');
        console.log('Download Successful', `Saved as:\n${uniqueFileName}`);
        await notifee.displayNotification({
          title: 'Download Complete',
          body: `${uniqueFileName} saved to Downloads folder.`,
          android: {
            channelId: 'downloads',
            smallIcon: 'wf_logo',
            pressAction: {
              id: 'open-pdf',
            },
          },
          data: {
            filePath: finalPath,
          },
        });
      } else {
        // Alert.alert('Certificate Downloaded Successful for IOS');
        console.log('Download Successful for IOS', `Saved as:\n${tempPath}`);
      }
    } catch (error) {
      console.error('PDF Save Error:', error);
      // Alert.alert('Error', error.message || 'Could not save the PDF.');
      await notifee.displayNotification({
        title: 'Download Failed',
        body: error.message || 'Could not save the PDF.',
        android: {
          channelId: 'downloads',
          smallIcon: 'wf_logo',
        },
      });
    }
  };

  const handleMutipleDidOnClick = async () => {
    if (selectedEmails.length === 0) {
      Alert.alert('Please select the email first');
      setEmailModal(true);
      return;
    }
    const selectedDIDs = userData
      .filter((_, index) => checkedItems[index])
      .map(item => item.did);

    if (selectedDIDs.length === 0) {
      Alert.alert('Please select at least one certificate.');
      return;
    }
    try {
      const res = await fetch(
        `${apiIp}user/grantMultipleDIDAccesstoMultipleVerifier`,
        {
          method: `POST`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            dids: selectedDIDs,
            verifierEmails: selectedEmails,
          }),
        },
      );
      const result = await res.json();

      if (res.ok) {
        console.log('Success handleMutipleDidOnClick API:', result);
        setEmailModal(false);
        setModal(false);
        setSelectedEmails([]);
        setCheckedItems({});
        Alert.alert('Access Granted Successfully.');
      } else {
        console.warn(' Failed handleMutipleDidOnClick:', result);
        Alert.alert('Failed to grant access. Please try again.');
      }
    } catch (error) {
      console.error(
        'Failed To Post Multiple did access due to Server Error. Please try again: ',
        error,
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Navbar */}
      <View style={styles.containerNavbar}>
        <TouchableOpacity onPress={openSidebar}>
          <MenuBar style={styles.menuImage} />
        </TouchableOpacity>
      </View>

      {/* Sidebar */}
      <Modal visible={isSidebarVisible} transparent animationType="none">
        <Pressable style={styles.overlay} onPress={closeSidebar} />
        <Animated.View
          style={[styles.sidebar, {transform: [{translateX: slideAnim}]}]}>
          <TouchableOpacity onPress={closeSidebar} style={styles.closeIcon}>
            <AntDesign name="close" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('List', {
                number,
                authToken,
                blockChainToken,
              })
            }>
            <Text style={styles.sidebarText}>Approved List</Text>
          </TouchableOpacity>
          <Text style={styles.sidebarText}>About</Text>
          <Text style={styles.sidebarText}>Contact Us</Text>
          <Text style={styles.sidebarText}>Help</Text>
          <TouchableOpacity
            style={styles.buttonContainerForCreateButton}
            onPress={handleLogout}>
            <Text style={styles.buttonTextCreateButton}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>

      {/* Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <BlurView
          style={styles.blurBackground}
          blurType="light"
          blurAmount={10}
          reducedTransparencyFallbackColor="white">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity onPress={closeModal} style={styles.closeIcon}>
                <AntDesign name="closecircleo" size={24} color="#C1272C" />
              </TouchableOpacity>
              <View style={styles.modalIconContainer}>
                <ModalIcon
                  width={60}
                  height={50}
                  style={{marginBottom: 40, alignSelf: 'center'}}
                />
                <View style={styles.modalContainer1}>
                  <Text style={styles.modalHeading}>
                    I'm giving consent to verify my documents.
                  </Text>
                  <Text style={styles.modalSubHeading}>
                    Are you sure you want to give permission?
                  </Text>
                </View>
              </View>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.modalRejectButton}
                  onPress={closeModal}>
                  <Text style={styles.modalRejectButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalAcceptButton}
                  onPress={() => {
                    setModal(false);
                    setEmailModal(true);
                  }}>
                  <Text style={styles.modalAceptButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal visible={emailModal} transparent animationType="slide">
        <BlurView
          style={styles.blurBackground}
          blurType="light"
          blurAmount={10}
          reducedTransparencyFallbackColor="white">
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, {maxHeight: '70%'}]}>
              <Text style={[styles.modalHeading]}>Select Emails to Verify</Text>

              <ScrollView
                contentContainerStyle={{
                  // marginVertical: 20,
                  position: 'relative',
                  alignItems: 'flex-start',
                  marginBottom: 50,
                }}>
                {Array.isArray(allEmails) && allEmails.length > 0 ? (
                  allEmails.map((email, index) => (
                    <TouchableOpacity
                      key={index}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 8,
                        position: 'relative',
                      }}
                      onPress={() => toggleEmail(email)}>
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 3,
                          borderWidth: 1,
                          marginRight: 10,
                          position: 'relative',
                          backgroundColor: selectedEmails.includes(email)
                            ? '#C1272C'
                            : 'white',
                        }}
                      />
                      {selectedEmails.includes(email) && (
                        <Text style={styles.checkmarkEmail}>✔</Text>
                      )}

                      <Text>{email}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No Data To Display</Text>
                  </View>
                )}
              </ScrollView>
              <View style={styles.modalEmail}>
                <TouchableOpacity
                  style={styles.modalRejectButton}
                  onPress={closeModalEmail}>
                  <Text style={styles.modalRejectButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalAcceptButton]}
                  onPress={handleMutipleDidOnClick}>
                  <Text style={styles.modalAceptButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.helloText}>Hello, {name}</Text>
        <View style={styles.headerRight}>
          {/* <TouchableOpacity style={styles.bellWrapper}>
            <Icon name="bell" size={22} color="#000" />
          </TouchableOpacity> */}
          {/* <Image
            source={{uri: 'https://randomuser.me/api/portraits/men/75.jpg'}}
            style={styles.avatar}
          /> */}
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>
              {capitalize(name)?.charAt(0)}
            </Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchFilterContainer}>
        <Search style={styles.searchImage} height={20} width={20} />
        <TextInput
          placeholder="Search"
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={text => setSearchTerm(text)}
        />
      </View>

      {loading ? (
        <SkeletonPlaceholder borderRadius={10}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={{marginBottom: 20, marginTop: 20}}>
              <View style={{height: 300, borderRadius: 10}} />
              <View style={{height: 20, width: '60%', marginTop: 10}} />
              <View style={{height: 20, width: '40%', marginTop: 6}} />
            </View>
          ))}
        </SkeletonPlaceholder>
      ) : error ? (
        <Text
          style={{
            textAlign: 'center',
            marginTop: 40,
            fontSize: 16,
            color: 'red',
          }}>
          There are no certificates issued for you as of now.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.certList}>
          {filteredCertificates.map((cert, index) => (
            <View key={index} style={styles.certCardMain}>
              <View key={index} style={styles.certCard}>
                {/* <WebView
                originWhitelist={['*']}
                source={{html: cert.html}}
                style={{height: 300, width: '100%', borderRadius: 10}}
                javaScriptEnabled
                scalesPageToFit
              /> */}
                <View style={styles.certInfo}>
                  <Text style={styles.certTitle}>{cert.certType}</Text>
                </View>
                <View style={styles.certDIDNum}>
                  <Text style={styles.didText}>
                    DID Number:{' '}
                    <Text style={styles.didNumberText}>{cert.did}</Text>{' '}
                  </Text>
                  <Text style={styles.certSubtitle}>
                    Name: <Text style={{color: '#C1272C'}}>{cert.name}</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.certActionsMain}>
                <View style={styles.certActions}>
                  <TouchableOpacity
                    onPress={() => viewFullCertificate(cert.html)}>
                    <MaterialIcons
                      name="visibility"
                      size={24}
                      color="#C1272C"
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.certActionsDownload}>
                  <TouchableOpacity
                    onPress={() =>
                      generateAndSavePDF(cert.html, cert.certType)
                    }>
                    <AntDesign name="download" size={28} color="#C1272C" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    checkedItems[index] && styles.checkboxChecked,
                  ]}
                  onPress={() => toggleCheckbox(index)}>
                  {checkedItems[index] && (
                    <Text style={styles.checkmark}>✔</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <BlurView
          style={styles.fullscreenBlur}
          blurType="light"
          blurAmount={10}
          reducedTransparencyFallbackColor="white">
          <View style={styles.modalContentView}>
            <View style={styles.modalContentContainer}>
              <TouchableOpacity
                style={{padding: 10, alignSelf: 'flex-end'}}
                onPress={() => setModalVisible(false)}>
                <AntDesign name="closecircleo" size={28} color="#C1272C" />
              </TouchableOpacity>
              {selectedCertificate && (
                <WebView
                  originWhitelist={['*']}
                  source={{html: selectedCertificate}}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  javaScriptEnabled
                  scalesPageToFit
                />
              )}
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* QR Button */}
      <TouchableOpacity
        style={[styles.scanButton, !isAnyChecked && styles.scanButtonDisabled]}
        disabled={!isAnyChecked}
        onPress={handleQrButtonClicked}>
        <Feather name="send" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7ED',
    padding: 13,
    paddingTop: 20,
  },
  blurBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerNavbar: {
    paddingBottom: 15,
  },
  //  noDataContainer: {
  //   flex: 1,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   height: 200,  // or whatever makes sense
  // },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  fallbackContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#C1272C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEmail: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    gap: 10,
  },
  fallbackText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  didNumberText: {
    color: '#F84349',
  },
  // overlay: {
  //   // padding: 10,
  //   // flex: 1,
  //   // // backgroundColor: 'rgba(0,0,0,0.4)',
  //   // justifyContent: 'center',

  // },
  certDIDNum: {
    marginTop: 7,
    // flexDirection: 'column',
    // justifyContent: 'center',
    // alignItems:'center'
  },
  fullscreenBlur: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },

  modalContentContainer: {
    flex: 1,
    // zIndex: 1,
    // backgroundColor: 'rgba(255, 255, 255, 0.95)', // slightly translucent white
    borderRadius: 10,
    marginTop: 100,
    // marginBottom: 20,
    // overflow: 'hidden',
    // justifyContent: 'center',
    // alignItems:"center"
    // backgroundColor: '#fff',
  },
  modalContentView: {
    flex: 0.73,
    // backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,

    // justifyContent: 'center',
    // alignItems: 'center',
    // flexDirection:'column'
    // flexDirection: 'row',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuImage: {
    width: 35,
    height: 35,
  },
  modalContainer1: {
    // display: 'flex',
    // flexDirection: 'row',
    // alignItems: 'center',
    gap: 10,
    // width: '78%',
  },
  modalIcon: {
    width: 50,
    height: 55,
  },
  modalBox: {
    backgroundColor: '#fff',
    // padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
  },
  modalContainer: {
    // flex: 1,
    position: 'relative',
    justifyContent: 'center',
    // backgroundColor: '#1C1C1C',
    // marginBottom:20
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },

  modalSubHeadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  modalRejectButtonText: {
    color: '#C1272C',
  },
  modalAceptButtonText: {
    color: '#fff',
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubHeading: {
    fontSize: 15,
    // width: '64%',
    // fontWeight: '800',
    // justifyContent:'center',
    // alignItems:'center',
    // display:'flex'
  },
  modalIconContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '78%',
    marginTop: 10,
  },
  scanButtonDisabled: {
    // backgroundColor: '#aaa',
    opacity: 0.6,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    width: '100%',
    // alignItems:'center',
    justifyContent: 'center',
    marginTop: 40,
    gap: 20,
  },
  modalRejectButton: {
    borderWidth: 2,
    borderColor: '#C1272C',
    borderRadius: 4,
    backgroundColor: '#FFF',
    paddingLeft: 50,
    paddingRight: 50,
    paddingTop: 5,
    paddingBottom: 5,
  },
  modalAcceptButton: {
    borderWidth: 2,
    borderColor: '#C1272C',
    borderRadius: 4,
    backgroundColor: '#C1272C',
    paddingLeft: 50,
    paddingRight: 50,
    paddingTop: 5,
    paddingBottom: 5,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#C1272C',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#C1272C',
    borderColor: '#C1272C',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    position: 'absolute',
    bottom: -2,
  },
  checkmarkEmail: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    position: 'absolute',
    // bottom: -4,
    left: 3,
  },

  searchImage: {
    position: 'absolute',
    zIndex: 1,
    left: 10,
  },

  closeIcon: {
    alignSelf: 'flex-end',
  },
  sidebarOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  buttonContainerForCreateButton: {
    backgroundColor: '#C1272C',
    borderRadius: 10,
    padding: 16,
    marginTop: 30,
    alignItems: 'center',
    width: '100%',
  },
  buttonTextCreateButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sidebar: {
    width: '50%',
    backgroundColor: '#FFFCF7',
    padding: 20,
    height: 900,
  },
  closeButton: {
    alignSelf: 'flex-end',
    textAlign: 'left',
  },
  sidebarText: {
    marginTop: 20,
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helloText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#FF5E5E',
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
    alignItems: 'center',
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    paddingLeft: 40,
    backgroundColor: '#FFFCF7',
    color: '#000',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
  },
  filterText: {
    marginRight: 5,
    color: '#000',
  },
  certList: {
    paddingTop: 20,
    // paddingBottom: 80,
    // paddingHorizontal: 6,
  },

  certCardMain: {
    // backgroundColor: '#f9f9f9',
    // borderRadius: 15,
    // padding: 10,
    // marginBottom: 20,
    // position: 'relative',
    backgroundColor: '#FFFCF7',
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
    position: 'relative',
    // display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    // alignItems:'center',
    // iOS shadow
    shadowColor: 'rgba(174, 24, 29, 0.96)',
    shadowOffset: {width: 10, height: 10},
    shadowOpacity: 1,
    shadowRadius: 10,

    // Android shadow
    elevation: 4,
    gap: 30,
  },
  certCard: {
    // justifyContent: 'space-between',
    // alignIte:'center'
  },
  certImage: {
    width: '100%',
    // height: 150,
    borderRadius: 10,
  },
  certActionsMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  certActions: {
    // position: 'absolute',
    // right: -4,
    // top: -50,
    // flexDirection: 'row',
    gap: 10,
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 10,
  },
  certActionsDownload: {
    // position: 'absolute',
    // right: -4,
    // top: -100,
    // flexDirection: 'column',
    gap: 5,
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 10,
  },
  certInfo: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  certTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    fontFamily: 'Nunito Sans',
  },
  certSubtitle: {
    fontSize: 12,
    color: '#555',
    marginTop: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#C1272C',
    borderRadius: 4,
  },
  scanButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#C1272C',
    borderRadius: 35,
    padding: 16,
    elevation: 5,
  },
});

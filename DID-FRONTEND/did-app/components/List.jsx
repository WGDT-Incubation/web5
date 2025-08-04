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

export default function List({route}) {
  // const {number, token} = route.params;

  // const [number, setNumber] = useState(route.params?.number || '');
  // const [token, setToken] = useState(route.params?.token || '');
  const [number, setNumber] = useState('');
  // const [token, setToken] = useState('');
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
  const [didNumber, setDidNumber] = useState([]);
  console.log('blockChainToken list page===', blockChainToken);
  console.log('authToken List Page===', authToken);

  console.log('number List Page ===', number);

  useEffect(() => {
    const syncAuth = async () => {
      try {
        if (
          route.params?.number &&
          route.params?.authToken &&
          route.params?.blockChainToken
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
          if (storedNum) setNumber(storedNum);
          if (storedAuthTok) setAuthToken(storedAuthTok);
          if (storedBlockTok) setBlockChainToken(storedBlockTok);
        }
      } catch (e) {
        console.warn('Secure-storage sync failed', e);
      }
    };

    syncAuth();
  }, [route.params]);

  useEffect(() => {
    if (!number || !authToken || !blockChainToken) return;

    const getRevokedDIDs = async () => {
      try {
        const res = await fetch(`${apiIp}user/getIdentity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${blockChainToken}`,
          },
          body: JSON.stringify({phoneNumber: number}),
        });

        if (!res.ok) {
          const msg = await res.text();
          console.error('getIdentity failed:', msg);
          return;
        }

        const result = await res.json();
        const dids = result?.response?.dids || {};
        const allEntries = Object.entries(dids);
        if (allEntries.length === 0) {
          setError('No certificates available for this phone number');
          setLoading(false);
          return;
        }
        // 🔴 Filter only revoked DIDs
        const revokedDIDs = Object.entries(dids)
          .filter(([, cert]) => cert?.isRevoked === false)
          .map(([didKey]) => didKey);

        console.log('Revoked DIDs ===>', revokedDIDs);
        setDidNumber(revokedDIDs); // ⚠️ This will be used by the next useEffect
      } catch (err) {
        console.error('Error in getIdentity:', err);
        setError('Error in getIdentity:');
      }
    };

    getRevokedDIDs();
  }, [number, authToken, blockChainToken, navigation]);

  // const filteredCertificates = userData.filter(cert => {
  //   const nameMatch = cert.name
  //     ?.toLowerCase()
  //     .includes(searchTerm.toLowerCase());
  //   const typeMatch = cert.certType
  //     ?.toLowerCase()
  //     .includes(searchTerm.toLowerCase());
  //   const didMatch = cert.did?.toLowerCase().includes(searchTerm.toLowerCase());
  //   return nameMatch || typeMatch || didMatch;
  // });

  useEffect(() => {
    if (didNumber.length === 0) return;

    const fetchVerifierEmails = async () => {
      // setLoading(true);
      const collected = [];

      for (const did of didNumber) {
        try {
          const res = await fetch(`${apiIp}user/getVerifiersForDID`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({did}),
          });

          if (!res.ok) {
            console.warn(
              `Verifier fetch for ${did} failed: HTTP ${res.status}`,
            );
            continue;
          }

          const {verifiers} = await res.json();

          if (Array.isArray(verifiers) && verifiers.length > 0) {
            verifiers.forEach(email => {
              collected.push({did, email});
            });
          }
        } catch (e) {
          console.error(`Error fetching verifiers for ${did}:`, e);
          setError('Error in fecthing verifiers');
        }
      }

      setAllEmails(collected);
      setLoading(false);

      console.log('✅ Final allEmails:', collected);
    };

    fetchVerifierEmails();
  }, [didNumber]);

  console.log('all Emails List===>>>', allEmails);
  const handleOptionPress = (routeName, params) => {
    closeSidebar(); // ① close this screen’s sidebar
    navigation.navigate(routeName, params); // ② then navigate
  };

  console.log('Result for email outside UseEffect verifier List===', allEmails);

  const toggleCheckbox = id => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
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

  const isAnyChecked = Object.values(checkedItems).some(val => val === true);

  const handleQrButtonClicked = () => {
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
  };

  const handleLogout = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Keychain.resetGenericPassword({service: 'authToken'});
        await Keychain.resetGenericPassword({service: 'blockChainToken'});
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
      setError('Error in logging out');
    }
  };

  const handleRemoveAccessForDID = async () => {
    // Gather exactly the pairs checked
    const selected = allEmails.filter((_, idx) => checkedItems[idx]);
    if (selected.length === 0) {
      Alert.alert('Please select at least one verifier to remove.');
      return;
    }

    try {
      // Do each removal in series (or use Promise.all for parallel)
      for (const {did, email} of selected) {
        const res = await fetch(`${apiIp}user/removeAccessForDID`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            did,
            verifierEmail: email, 
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          // stop on first error
          throw new Error(json.error || 'Unknown server error');
        }
        console.log(`Removed ${email} for DID ${did}:`, json.message);
        Alert.alert(json.message);
      }

      setAllEmails(prev => prev.filter((_, idx) => !checkedItems[idx]));
      setCheckedItems({});
      setModal(false);
    } catch (err) {
      console.error('removeAccessForDID error', err);
      setError('Remove Access for DID');
      Alert.alert('Failed to remove access:', err.message);
    }
  };

  const capitalize = name => {
    if (typeof name !== 'string' || !name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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
            // onPress={() => navigation.navigate('MainPage')}
            onPress={() => handleOptionPress('MainPage')}>
            <Text style={styles.sidebarText}>Home</Text>
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
                    I'm giving consent to remove verifier email from my
                    documents.
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
                    handleRemoveAccessForDID();
                  }}>
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
      {/* <View style={styles.searchFilterContainer}>
        <Search style={styles.searchImage} height={20} width={20} />
        <TextInput
          placeholder="Search"
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={text => setSearchTerm(text)}
        />
      </View> */}

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
          Failed to fetch list.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.certList}>
          {allEmails.length > 0 ? (
            allEmails.map(({did, email}, idx) => (
              <View key={idx} style={styles.certCardMain}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    checkedItems[idx] && styles.checkboxChecked,
                  ]}
                  onPress={() =>
                    setCheckedItems(ci => ({...ci, [idx]: !ci[idx]}))
                  }>
                  {checkedItems[idx] && <Text style={styles.checkmark}>✔</Text>}
                </TouchableOpacity>
                <View style={styles.emailContainer}>
                  <Text>
                    DID: <Text style={styles.didNumberText}>{did}</Text>
                  </Text>
                  <Text>
                    Email: <Text style={styles.didNumberText}>{email}</Text>
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text>No Verifiers Registered</Text>
          )}
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
      {/* <TouchableOpacity
        style={[styles.scanButton, !isAnyChecked && styles.scanButtonDisabled]}
        disabled={!isAnyChecked}
        onPress={handleQrButtonClicked}
        >
        <Feather name="corner-up-left" size={28} color="#fff" />
      </TouchableOpacity> */}
      <TouchableOpacity
        style={[
          styles.scanButton,
          !Object.values(checkedItems).some(v => v) &&
            styles.scanButtonDisabled,
        ]}
        disabled={!Object.values(checkedItems).some(v => v)}
        onPress={handleQrButtonClicked}>
        <Feather name="corner-up-left" size={28} color="#fff" />
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
  emailContainer: {
    flexDirection: 'column',
    gap: 5,
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
  didValue: {},
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
    fontWeight: '700',
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

  //   checkbox: {
  //     width: 24,
  //     height: 24,
  //     borderWidth: 2,
  //     borderColor: '#C1272C',
  //     borderRadius: 4,
  //     justifyContent: 'center',
  //     alignItems: 'center',
  //   },
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
    // padding: 10,
    // paddingBottom: 80,
    // paddingVertical: 6,
    marginTop: 30,
  },

  certCardMain: {
    // backgroundColor: '#f9f9f9',
    // borderRadius: 15,
    // padding: 10,
    // marginBottom: 20,
    // position: 'relative',
    backgroundColor: '#FFFCF7',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    // position: 'relative',
    // display: 'flex',
    flexDirection: 'row',
    // justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    // alignItems:'center',
    gap: 15,
    // iOS shadow
    shadowColor: 'rgba(174, 24, 29, 0.96)',
    shadowOffset: {width: 10, height: 10},
    shadowOpacity: 1,
    shadowRadius: 10,

    // Android shadow
    // elevation: 4,
    // gap: -30,
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

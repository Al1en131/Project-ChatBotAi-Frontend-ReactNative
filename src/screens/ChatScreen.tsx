import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TWINKLETALK_API_KEY = 'Your Gemini API';
const API_URL = 'http://10.0.2.2:5000';

type Message = {
  text: string;
  sender: 'user' | 'twinkletalk';
};

const Header = () => (
  <View style={styles.header}>
    <Text style={styles.headerText}>TwinkleTalk</Text>
  </View>
);

const ChatBotAiScreen = ({ navigate }: { navigate: (screen: string) => void }) => {
  const [msg, setMsg] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  const saveMessageToBackend = async (message: Message) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'User not authenticated');
        navigate('LoginScreen');
        return;
      }

      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(message),
      });

      const data = await response.json();
      if (response.ok) {
        console.log('Message saved successfully:', data);
      } else {
        Alert.alert('Error', data.message || 'Failed to save message');
      }
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  const fetchTwinkleTalkReply = async (userMessage: string) => {
    // Deteksi pertanyaan tentang nama
    const keywords = ['nama', 'siapa kamu', 'what is your name', 'who are you'];
    const lowerCaseMessage = userMessage.toLowerCase();

    if (keywords.some(keyword => lowerCaseMessage.includes(keyword))) {
      return 'Saya adalah TwinkleTalk, asisten AI Anda!';
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${TWINKLETALK_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: userMessage,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text || 'TwinkleTalk is here to help!';
      return reply;
    } catch (error) {
      console.error('Error fetching TwinkleTalk response:', error);
      return 'Error occurred in TwinkleTalk';
    }
  };

  const handleButtonClick = async () => {
    if (!msg.trim()) {
      Alert.alert('Error', 'Message cannot be empty');
      return;
    }

    const userMessage: Message = { text: msg, sender: 'user' };
    setMessages(prevMessages => [userMessage, ...prevMessages]);
    setMsg('');

    try {
      await saveMessageToBackend(userMessage);
      const twinkletalkReply = await fetchTwinkleTalkReply(msg);
      const twinkleMessage: Message = { text: twinkletalkReply, sender: 'twinkletalk' };
      setMessages(prevMessages => [twinkleMessage, ...prevMessages]);

      await saveMessageToBackend(twinkleMessage);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[styles.message, item.sender === 'user' ? styles.userMessage : styles.twinkletalkMessage]}
    >
      <Text
        style={[
          styles.messageText,
          item.sender === 'user' ? styles.userMessageText : styles.twinkletalkMessageText,
        ]}
      >
        {item.text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.messagesContainer}
        inverted
      />
      <View style={styles.inputView}>
        <TextInput
          style={styles.input}
          placeholder="Enter Your Query...."
          value={msg}
          onChangeText={setMsg}
          placeholderTextColor="black"
        />
        <TouchableOpacity style={styles.button} onPress={handleButtonClick}>
          <Text style={styles.buttonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#494F55',
  },
  header: {
    backgroundColor: 'blue',
    padding: 15,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  messagesContainer: {
    padding: 10,
  },
  message: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  userMessage: {
    backgroundColor: 'blue',
    alignSelf: 'flex-end',
  },
  twinkletalkMessage: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: 'white',
  },
  userMessageText: {
    color: 'white',
  },
  twinkletalkMessageText: {
    color: 'black',
  },
  inputView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#494F55',
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    color: 'black',
  },
  button: {
    backgroundColor: 'blue',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ChatBotAiScreen;
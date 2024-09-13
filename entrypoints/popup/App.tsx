import { useState, useEffect } from 'react';
import { ChakraProvider, Box, Flex, Icon, Text, Switch, Link, Divider, Select } from '@chakra-ui/react';
import { theme } from '@/theme/theme';
import { FaYoutube } from 'react-icons/fa';
import { snapshotShowFps, snapshotPosition, snapShotMiniMode } from '@/utils/storage';

// ポップアップページのコンポーネント
export default function App() {
  const [miniMode, setMiniMode] = useState(false);
  const [showFps, setShowFps] = useState(true);
  const [position, setPosition] = useState('top-right');

  // コンポーネント読み込み時に動作し、ストレージから設定値を取得する
  // useEffect での async の指定方法に注意
  useEffect(() => {
    const getStorageValues = async () => {
      setMiniMode(await snapShotMiniMode.getValue());
      setShowFps(await snapshotShowFps.getValue());
      setPosition(await snapshotPosition.getValue());
    };
    getStorageValues();
  }, []);

  // ミニモードトグルスイッチを切り替えた際に呼び出され、設定値をストレージに保存する
  const handleMiniToggle = async () => {
    setMiniMode(!miniMode);
    await snapShotMiniMode.setValue(!miniMode);
  };

  // FPSトグルスイッチを切り替えた際に呼び出され、設定値をストレージに保存する
  const handleFpsToggle = async () => {
    setShowFps(!showFps);
    await snapshotShowFps.setValue(!showFps);
  };

  // ポジションセレクトを変更した際に呼び出され、設定値をストレージに保存する
  const handlePositionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPosition(e.target.value);
    await snapshotPosition.setValue(e.target.value);
  };

  return (
    <ChakraProvider theme={theme}>
      <Box width="280px" mx="auto">
        <Flex justify="center" align="center" p={4} bg={'red.500'} color={'white'}>
          <Icon as={FaYoutube} boxSize={8} />
          <Text fontSize="xl" ml={2}>Youtube Snapshot</Text>
        </Flex>
        <Box p={4}>
          <Flex align="center" justify="space-between">
            <Text fontSize="medium">Mini Mode</Text>
            <Switch isChecked={miniMode} onChange={handleMiniToggle} />
          </Flex>
        </Box>
        <Box p={4}>
          <Flex align="center" justify="space-between">
            <Text fontSize="medium">Show FPS</Text>
            <Switch isChecked={showFps} onChange={handleFpsToggle} />
          </Flex>
        </Box>
        <Box p={4}>
          <Flex align="center" justify="space-between">
            <Text fontSize="medium">Position</Text>
            <Select value={position} onChange={handlePositionChange} width="150px">
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
            </Select>
          </Flex>
        </Box>
        <Box mb={2} textAlign="center">
          <Divider />
          <Flex justify="center" align="center">
            <Text mr={2}>2024 </Text>
            <Link href="https://qiita.com/kerobot" isExternal>kerobot</Link>
          </Flex>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

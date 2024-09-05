import { useState, useEffect } from 'react';
import { ChakraProvider, Box, Flex, Icon, Text, Switch, Link, Divider } from '@chakra-ui/react';
import { theme } from '@/theme/theme';
import { FaYoutube } from 'react-icons/fa';
import { snapshotShowFps } from '@/utils/storage';

export default function App() {
  const [showFps, setShowFps] = useState(false);

  // コンポーネント読み込み時に動作し、ストレージから設定値を取得する
  // useEffect での async の指定方法に注意
  useEffect(() => {
    const getShowFps = async () => {
      setShowFps(await snapshotShowFps.getValue());
    };
    getShowFps();
  }, []);

  // トグルスイッチを切り替えた際に呼び出され、設定値をストレージに保存する
  const handleToggle = async () => {
    setShowFps(!showFps);
    await snapshotShowFps.setValue(!showFps);
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
            <Text fontSize="medium">Show FPS</Text>
            <Switch isChecked={showFps} onChange={handleToggle} />
          </Flex>
        </Box>
        <Box mb={2} textAlign="center">
          <Divider />
          <Flex justify="center" align="center">
            <Text mr={2}>2024 ©</Text>
            <Link href="https://qiita.com/kerobot" isExternal>kerobot</Link>
          </Flex>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

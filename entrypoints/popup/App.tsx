import React, { useState, useEffect } from 'react';
import { ChakraProvider, Box, Flex, Icon, Text, Switch, FormControl, FormLabel } from '@chakra-ui/react';
import { FaBeer } from 'react-icons/fa';
import { theme } from '@/theme/theme';
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
      <Box p={4}>
        <Flex align="center" mb={4} bg="red.500" p={2} borderRadius="md" whiteSpace="nowrap">
          <Icon as={FaBeer} w={6} h={6} mr={2} color="white" />
          <Text fontSize="xl" color="white">Youtube Snapshot</Text>
        </Flex>
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="show-fps" mb="0">Show FPS</FormLabel>
          <Switch id="show-fps" isChecked={showFps} onChange={handleToggle} />
        </FormControl>
      </Box>
    </ChakraProvider>
  );
}

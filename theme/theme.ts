import { extendTheme } from "@chakra-ui/react";

// Chakra UI のテーマを拡張
export const theme = extendTheme({
    styles: {
      global: {
        body: {
          margin: '0',
          padding: '0',
        },
      },
    },
  });

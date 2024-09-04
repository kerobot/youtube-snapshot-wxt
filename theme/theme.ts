import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
    styles: {
      global: {
        body: {
          margin: '0',
          display: 'flex',
          placeItems: 'center',
        },
      },
    },
  });

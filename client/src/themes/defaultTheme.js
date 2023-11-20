import { createTheme } from "@mui/material/styles";

const defaultTheme = createTheme({
  palette: {
    primary: {
      // main: "#6600cc",
      // main: "#10253f",
      main: "#1f487a",
    },
    // border: {
      // main: "#e6e6e6",
    // },
  },
  // fontFamily: '"VT323"',
  // typography: {
    // fontFamily: '"VT323"',
    // customFontColor: {
    //     primary: '#000000',
    //     secondary: '#555555',
    // },
  // },
  components: {
    MuiButton: {
      styleOverrides: {
        // root: {
          // fontFamily: '"VT323"',
        // },
        // contained: {
          // backgroundColor: "#e35454",
          // "&:hover": {
          //   backgroundColor: "#e32727", // Изменение цвета при наведении
          //   textDecoration: "underline #eda6a6", // Добавление подчеркивания при наведении
          // },
        // },
        // outlined: {
          // borderColor: "#e32727",
          // "&:hover": {
          //   backgroundColor: "inherit",
          //   textDecoration: "underline #eda6a6", // Добавление подчеркивания при наведении
          // },
        // },
      },
    },
    MuiLink: {
      styleOverrides: {
        // root: {
          // fontFamily: '"VT323"', // Замените на ваш выбранный шрифт
          // textDecoration: "none", // Убрать подчёркивание по умолчанию
          // color: "inherit",
          // "&:hover": {
          //   textDecoration: "underline", // Подчёркивание при наведении
          // },
        // },
      },
    },
  },
});

export default defaultTheme;

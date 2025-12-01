'use strict';

module.exports = {
  darkMode: 'class',
  content: ['./public/*.html', './public/*.js', './src/*.html', './build.js', './src/**/*.md'],
  theme: {
    extend: {
      colors: {
        'red-berry': {
    '50': '#ffeeee',
    '100': '#ffdada',
    '200': '#ffbbbb',
    '300': '#ff8b8b',
    '400': '#ff4949',
    '500': '#ff1111',
    '600': '#ff0000',
    '700': '#e70000',
    '800': '#be0000',
    '900': '#880000',
    '950': '#560000',
},

      }
    },
  },
  plugins: [],
};

import { IconType } from 'react-icons';

declare global {
  namespace JSX {
    interface Element {
      type?: IconType;
    }
  }
}

export {}; 
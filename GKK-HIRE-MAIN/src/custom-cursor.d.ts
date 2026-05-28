declare module '../../CustomCursor.jsx' {
  import type { FC } from 'react';

  interface CustomCursorProps {
    label?: string;
    color?: string;
  }

  const CustomCursor: FC<CustomCursorProps>;
  export default CustomCursor;
}

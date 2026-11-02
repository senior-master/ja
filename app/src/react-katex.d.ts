declare module 'react-katex' {
  import { ReactNode } from 'react';

  export interface MathComponentProps {
    math: string;
    errorColor?: string;
    renderError?: (error: Error) => ReactNode;
    children?: ReactNode;
  }

  export const InlineMath: React.FC<MathComponentProps>;
  export const BlockMath: React.FC<MathComponentProps>;
}

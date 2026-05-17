// Global type augmentations for JoblifyHQ
import type { SVGProps } from 'react';

// Fix react-icons type compatibility
declare module 'react-icons' {
  export interface IconBaseProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    title?: string;
    className?: string;
  }
}

// Flutterwave on window
interface Window {
  FlutterwaveCheckout: (options: Record<string, unknown>) => void;
}

// process.env
declare const process: {
  env: Record<string, string | undefined>;
};

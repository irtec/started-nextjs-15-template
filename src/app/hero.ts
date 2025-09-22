// hero.ts
import { heroui } from '@heroui/react'
// or import from theme package if you are using individual packages.
// import { heroui } from "@heroui/theme";
export default heroui({
	themes: {
		light: {
			colors: {
				primary: {
					DEFAULT: '#000000',
					foreground: '#FFFFFF',
				},
				secondary: {
					DEFAULT: '#FFFFFF',
					foreground: '#000000',
				},
			},
		},
		dark: {
			colors: {
				primary: {
					DEFAULT: '#FFFFFF',
					foreground: '#000000',
				},
				secondary: {
					DEFAULT: '#000000',
					foreground: '#FFFFFF',
				},
			},
		},
	},
})

import type { Metadata } from 'next'
import '@/app/globals.css'
import Providers from '@/app/providers'
import { generateMetadata } from '@/utils/generate-metadata'
// Supports weights 100-900
import '@fontsource-variable/geist'
export const metadata: Metadata = generateMetadata({
	title: 'Template Next.js 15',
	description: 'Template Next.js 15',
})

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}

import type { Metadata } from 'next'

interface Props {
	title: string
	description?: string
	canonicalUrl?: string
	ogImg?: string
	category?: string
}

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const siteName = 'Next.js Secure Template'
const descriptionDefault =
	'A secure Next.js 16 template with comprehensive security features'

export const generateMetadata = ({
	title,
	description,
	ogImg,
	canonicalUrl,
}: Props): Metadata => {
	return {
		title: `${title} | ${siteName}`,
		description: description ?? descriptionDefault,
		metadataBase: new URL(siteUrl),
		alternates: {
			canonical: `${siteUrl}${canonicalUrl ?? ''}`,
		},
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
			},
		},
		openGraph: {
			title: {
				template: `%s | ${siteName}`,
				default: siteName,
			},
			description: description ?? descriptionDefault,
			url: `${siteUrl}/${canonicalUrl}`,
			siteName,
			images: [
				{
					url: ogImg ?? '/og-image.png',
				},
			],
			locale: 'en',
			type: 'website',
		},
		twitter: {
			card: 'summary',
			title: `${title} | ${siteName}`,
			description: description ?? descriptionDefault,
			images: [ogImg ?? '/og-image.png'],
		},
		keywords: [],
	}
}

'use client'
import { Button } from '@heroui/react'
import { Home01Icon } from 'hugeicons-react'
import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
	return (
		<section className="flex flex-col items-center h-screen mt-10">
			<Image
				src="/404-not-found.webp"
				alt="404 Not Found"
				width={250}
				height={250}
			/>
			<h2 className="text-4xl font-bold pb-5">Oops! Page not found</h2>
			<Button
				as={Link}
				href="/"
				startContent={<Home01Icon size={18} />}
				color="primary"
			>
				Return Home
			</Button>
		</section>
	)
}

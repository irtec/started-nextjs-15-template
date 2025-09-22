'use client'

import { Button } from '@heroui/react'
import { Home01Icon, ReloadIcon } from 'hugeicons-react'
import Link from 'next/link'
import { useEffect } from 'react'

interface Props {
	error: Error & { digest?: string }
	reset: VoidFunction
}

export default function ErrorPage({ error, reset }: Props) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<section className="flex flex-col items-center justify-center h-screen">
			<h1 className="text-4xl font-bold py-8">Something went wrong!</h1>

			<div className="flex gap-4">
				<Button
					as={Link}
					href="/"
					startContent={<Home01Icon size={18} />}
					variant="light"
				>
					Go back
				</Button>
				<Button
					onPress={() => reset()}
					startContent={<ReloadIcon size={18} strokeWidth={2} />}
					color="primary"
				>
					Try again
				</Button>
			</div>
		</section>
	)
}

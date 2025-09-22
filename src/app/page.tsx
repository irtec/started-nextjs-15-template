import ThemeToggle from '@/components/theme/theme-toggle'

const page = () => {
	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<ThemeToggle />
			<h1 className="text-4xl font-bold">Hello World</h1>
		</div>
	)
}

export default page


export default function AppLayout({ children }: Readonly<{children: React.ReactNode }>) {
    return (
        <div className="w-[50%] mx-auto">
            <div className="bg-[#1e1e1e] px-4 py-2 flex items-center space-x-4 rounded-t-xl">
                <button className="bg-gray-700 text-white w-5 h-5" />
                <input
                    type="text"
                    placeholder="Знайдіть щось"
                    className="flex-1 bg-white text-black rounded-md px-3 py-2"
                />
                <button className="bg-gray-700 w-8 h-8" />
            </div>

            <div className="bg-muted/50">
                {children}
            </div>
        </div>
    )
}

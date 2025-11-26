export default function Logo({ className = "w-20 h-20", textSize = "text-2xl" }) {
    return (
        <div className={`bg-primary rounded-full flex items-center justify-center text-white font-bold ${className} ${textSize}`}>
            <svg className="h-3/5 w-3/5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm0 2c-2.21 0-4 1.79-4 4h8c0-2.21-1.79-4-4-4zm8-7a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2V4a2 2 0 114 0v2h4V4a2 2 0 114 0v2h2z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
        </div>
    );
}

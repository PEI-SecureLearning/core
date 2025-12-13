

export const ServiceUnavailable = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-800 font-sans">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
                <div className="mb-6">
                    <svg
                        className="w-16 h-16 mx-auto text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        ></path>
                    </svg>
                </div>
                <h1 className="text-2xl font-bold mb-4 text-gray-900">Service Unavailable</h1>
                <p className="text-gray-600 mb-6">
                    We are currently unable to connect to the authentication service. Please try again later.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition duration-200"
                >
                    Retry
                </button>
            </div>
        </div>
    );
};

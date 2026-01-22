import React from 'react';

const AdminAnalytics: React.FC = () => {
    // Using the shared site code 'digibook' as established in previous steps.
    // The 'frame=1' query parameter is often used for embedding, or just the root url.
    // According to GoatCounter help/frame, usually you just embed the URL.
    // We will use the main dashboard URL.
    // To allow embedding, the user needs to enable "Allow embedding in a frame" in GoatCounter settings.
    // I will add a note about this.
    const analyticsUrl = "https://digibook.goatcounter.com?hide_header=1";

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent inline-block">
                        Thống kê truy cập (GoatCounter)
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium">Theo dõi lượng người dùng truy cập theo thời gian thực</p>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
                <iframe
                    src={analyticsUrl}
                    frameBorder="0"
                    className="w-full h-full absolute inset-0"
                    title="GoatCounter Analytics"
                    allowTransparency
                ></iframe>
            </div>

            <div className="bg-blue-50 text-blue-700 p-4 rounded-xl border border-blue-100 flex gap-3 text-sm">
                <i className="fa-solid fa-circle-info mt-0.5"></i>
                <div>
                    <p className="font-bold mb-1">Không thấy bảng thống kê?</p>
                    <p>
                        Vui lòng truy cập trang quản trị GoatCounter (<a href="https://digibook.goatcounter.com" target="_blank" rel="noreferrer" className="underline">digibook.goatcounter.com</a>),
                        vào <strong>Settings</strong> &gt; <strong>Site settings</strong> &gt; <strong>Allow embedding in a frame</strong> để cho phép hiển thị trong trang Admin này.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;

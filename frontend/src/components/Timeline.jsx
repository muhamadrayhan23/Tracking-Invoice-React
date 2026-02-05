import React from 'react';

// Helper function tetap sama
const getStatusClass = (event) => {
    const baseClasses = 'text-xs px-2 py-1 rounded';
    const statusClasses = {
        quotation: {
            Draft: 'text-gray-500 bg-gray-50',
            Sent: 'text-blue-500 bg-blue-50',
            Revised: 'text-yellow-500 bg-yellow-50',
            Approved: 'text-green-500 bg-green-50',
            Rejected: 'text-red-500 bg-red-50',
        },
        invoice: {
            Draft: 'text-gray-500 bg-gray-50',
            Issued: 'text-yellow-500 bg-yellow-50',
            'Partially Paid': 'text-blue-500 bg-blue-50',
            Paid: 'text-green-500 bg-green-50',
            Overdue: 'text-red-500 bg-red-50',
        },
        payment: {
            Paid: 'text-green-500 bg-green-50',
            Overdue: 'text-red-500 bg-red-50',
        },
    };

    const typeClasses = statusClasses[event.type] || {};
    return `${baseClasses} ${typeClasses[event.status] || 'text-gray-500 bg-gray-50'}`;
};

const Timeline = ({ events }) => {
    return (
        <div className="relative pl-8 ">
            {/* Line */}
            <div className="absolute left-2.5 top-2 bottom-0 w-0.5 bg-blue-500"></div>

            {events.map((event, index) => (
                <div key={index} className="relative mb-8 last:mb-0">
                    {/* Timeline marker*/}
                    <div className="absolute -left-7 top-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white z-10"></div>

                    {/* Konten Event */}
                    <div className="bg-white border border-gray-200 p-4 rounded-lg ml-2 hover:shadow-md">
                        {/* Header: Judul & Status */}
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 leading-tight">
                                    {event.description}
                                </h4>

                                {/* Render Quotation Number untuk source quotation */}
                                {event.source === 'quotation' && event.quotation_number && (
                                    <p className="text-[11px] font-semibold text-blue-500 mt-0.5">
                                        {event.quotation_number}
                                    </p>
                                )}

                                {/* Render Invoice Number untuk source invoice */}
                                {event.source === 'invoice' && event.invoice_number && (
                                    <p className="text-[11px] font-semibold text-blue-500 mt-0.5">
                                        {event.invoice_number}
                                    </p>
                                )}
                            </div>
                            <span className={`${getStatusClass(event)} shrink-0 ml-2`}>
                                {event.status}
                            </span>
                        </div>

                        <div className="space-y-1">
                            {event.user && (
                                <p className="text-xs text-gray-600 flex items-center">
                                    <span className="text-gray-400 mr-1">By:</span>
                                    <span className="font-semibold">{event.user}</span>
                                </p>
                            )}

                            {event.term_number && (
                                <p className="text-[11px] text-gray-700 font-medium">
                                    Payment Terms {event.term_number}
                                </p>
                            )}

                            <p className="text-[11px] text-gray-500 italic">
                                on {new Date(event.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })},
                                at {new Date(event.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>

                            {event.amount && (
                                <p className="text-xs font-bold text-emerald-600 pt-1">
                                    Amount: Rp {Number(event.amount).toLocaleString('id-ID')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Timeline;
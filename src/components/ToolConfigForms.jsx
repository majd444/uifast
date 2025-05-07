import React from 'react';

// Calendar Configuration Component
export const CalendarConfigForm = ({ connectedServices, handleConnectService }) => {
  return (
    <div className="mt-2 space-y-3">
      <h3 className="font-medium text-sm">Google Calendar Configuration</h3>
      
      <div>
        <label className="block text-xs text-gray-600 mb-1">Connection*</label>
        <div className="flex items-center">
          {connectedServices['calendar'] ? (
            <span className="text-green-600 text-xs flex items-center">
              <span className="bg-green-100 p-1 rounded-full mr-1">✓</span> Connected
            </span>
          ) : (
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
              onClick={() => handleConnectService('calendar')}
            >
              Create a connection
            </button>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-xs text-gray-600 mb-1">Calendar ID*</label>
        <input 
          type="text" 
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          placeholder="primary"
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
      
      <div>
        <label className="block text-xs text-gray-600 mb-1">Event Name*</label>
        <input 
          type="text" 
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          placeholder="Meeting with client"
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
      
      <div>
        <label className="block text-xs text-gray-600 mb-1">Start Date</label>
        <input 
          type="datetime-local" 
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
      
      <div>
        <label className="block text-xs text-gray-600 mb-1">Duration (minutes)</label>
        <input 
          type="number" 
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          placeholder="30"
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

// Gmail Configuration Component
export const GmailConfigForm = ({ connectedServices, handleConnectService }) => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm">Gmail Configuration</h3>
      
      <div>
        <label className="block text-sm text-gray-700 mb-1">Connection:</label>
        <div className="flex items-center">
          {connectedServices['gmail'] ? (
            <span className="text-green-600 text-sm flex items-center">
              <span className="bg-green-100 p-1 rounded-full mr-1">✓</span> Connected
            </span>
          ) : (
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center"
              onClick={() => handleConnectService('gmail')}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm5.144 14.5h-10.288c-.472 0-.856-.384-.856-.856v-7.288c0-.472.384-.856.856-.856h10.288c.472 0 .856.384.856.856v7.288c0 .472-.384.856-.856.856zm-5.144-3.043l-4.671-3.241v.482l4.671 3.241 4.671-3.241v-.482l-4.671 3.241z"/>
              </svg>
              Connect with Google
            </button>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm text-gray-700 mb-1">To: *</label>
        <div className="relative">
          <select 
            className="appearance-none w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white" 
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option>Direct Input</option>
            <option>From Variable</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
        <input 
          type="text" 
          className="w-full px-3 py-2 mt-2 text-sm border border-gray-300 rounded" 
          placeholder="Enter recipient email address"
          onMouseDown={(e) => e.stopPropagation()}
        />
        <button 
          className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="mr-1">+</span> Add a recipient
        </button>
      </div>
      
      <div>
        <label className="block text-sm text-gray-700 mb-1">Subject:</label>
        <input 
          type="text" 
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded" 
          placeholder="Email subject"
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
      
      <div>
        <label className="block text-sm text-gray-700 mb-1">Content:</label>
        <textarea 
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded h-24" 
          placeholder="You can use HTML tags"
          onMouseDown={(e) => e.stopPropagation()}
        ></textarea>
      </div>
      
      <div>
        <label className="block text-sm text-gray-700 mb-1">Attachments:</label>
        <div className="flex items-center">
          <button 
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-3 py-2 rounded border border-gray-300"
            onMouseDown={(e) => e.stopPropagation()}
          >
            Add file
          </button>
        </div>
      </div>
    </div>
  );
};

// Drive Configuration Component
export const DriveConfigForm = ({ connectedServices, handleConnectService }) => {
  return (
    <div className="mt-2 space-y-3">
      <h3 className="font-medium text-sm">Google Drive Configuration</h3>
      
      <div>
        <label className="block text-xs text-gray-600 mb-1">Connection*</label>
        <div className="flex items-center">
          {connectedServices['drive'] ? (
            <span className="text-green-600 text-xs flex items-center">
              <span className="bg-green-100 p-1 rounded-full mr-1">✓</span> Connected
            </span>
          ) : (
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
              onClick={() => handleConnectService('drive')}
            >
              Create a connection
            </button>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-xs text-gray-600 mb-1">File Path</label>
        <input 
          type="text" 
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          placeholder="/path/to/file"
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

// Function to get the appropriate config form based on service
export const getConfigForm = (service, connectedServices, handleConnectService) => {
  switch (service) {
    case 'calendar':
      return <CalendarConfigForm connectedServices={connectedServices} handleConnectService={handleConnectService} />;
    case 'gmail':
      return <GmailConfigForm connectedServices={connectedServices} handleConnectService={handleConnectService} />;
    case 'drive':
      return <DriveConfigForm connectedServices={connectedServices} handleConnectService={handleConnectService} />;
    default:
      return (
        <div className="p-2 bg-gray-50 rounded text-sm text-gray-600">
          Configuration options for {service}
        </div>
      );
  }
};

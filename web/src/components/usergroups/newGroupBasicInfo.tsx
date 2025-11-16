
interface BasicInfoSectionProps {
  groupName: string;
  description: string;
  selectedColor: string;
  colors: Color[];
  onGroupNameChange: (name: string) => void;
  onDescriptionChange: (desc: string) => void;
  onColorSelect: (color: string) => void;
}

interface Color {
  name: string;
  class: string;
  bg: string;
}


export default function BasicInfo({
  groupName,
  description,
  selectedColor,
  colors,
  onGroupNameChange,
  onDescriptionChange,
  onColorSelect
}: BasicInfoSectionProps) {
    return( 
        <div className="h-full w-full card shadow-lg radius-lg p-6 border rounded-lg">
            <div className='w-full items-center justify-center flex flex-col'>
                <div className='w-full'>
                    <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
                        Group Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="groupName"
                        value={groupName}
                        onChange={(e) => onGroupNameChange(e.target.value)}
                        placeholder="e.g., Marketing Team"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>

                <div className='w-full mt-4'>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        rows={4}
                        placeholder="Describe the purpose of this group..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Help others understand what this group is for</p>
                </div>

                <div className='w-full mt-4'>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Group Color
                    </label>
                    <div className="flex gap-3 flex-wrap">
                        {colors.map((color) => (
                        <button
                            key={color.name}
                            type="button"
                            onClick={() => onColorSelect(color.name)}
                            className={`h-12 w-12 rounded-full bg-gradient-to-br ${color.class} hover:scale-110 transition-all duration-200 ${
                            selectedColor === color.name 
                                ? 'ring-4 ring-offset-2 ring-purple-300' 
                                : 'ring-2 ring-transparent hover:ring-gray-300'
                            }`}
                            aria-label={`Select ${color.name}`}
                        />
                        ))}
                    </div>
        
            </div>
        </div>
    </div>
    );
}
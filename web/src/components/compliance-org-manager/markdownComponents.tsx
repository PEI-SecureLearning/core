// Shared ReactMarkdown component renderers used by both PolicyEditor and PolicyPreviewModal

export const markdownComponents = {
    h1: ({ children }: { children?: React.ReactNode }) => (
        <h1 className= "text-xl font-semibold text-gray-900 mb-3" > { children } </h1>
  ),
h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className= "text-lg font-semibold text-gray-900 mt-6 mb-2" > { children } </h2>
  ),
h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className= "text-base font-semibold text-gray-900 mt-4 mb-2" > { children } </h3>
  ),
p: ({ children }: { children?: React.ReactNode }) => (
    <p className= "text-sm text-gray-800 leading-6 mb-3" > { children } </p>
  ),
ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className= "list-disc pl-5 space-y-1 text-sm text-gray-800 mb-3" > { children } </ul>
  ),
ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className= "list-decimal pl-5 space-y-1 text-sm text-gray-800 mb-3" > { children } </ol>
  ),
li: ({ children }: { children?: React.ReactNode }) => (
    <li className= "leading-6" > { children } </li>
  ),
hr: () => <hr className="my-4 border-gray-200" />,
    table: ({ children }: { children?: React.ReactNode }) => (
        <div className= "overflow-x-auto mb-4" >
        <table className="min-w-full border border-gray-200 text-sm text-gray-800" >
            { children }
            </table>
            </div>
  ),
thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className= "bg-gray-50 text-gray-900 font-semibold" > { children } </thead>
  ),
tbody: ({ children }: { children?: React.ReactNode }) => <tbody>{ children } </tbody>,
tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className= "border-b" > { children } </tr>
  ),
th: ({ children }: { children?: React.ReactNode }) => (
    <th className= "px-3 py-2 text-left border-r last:border-r-0" > { children } </th>
  ),
td: ({ children }: { children?: React.ReactNode }) => (
    <td className= "px-3 py-2 align-top border-r last:border-r-0" > { children } </td>
  ),
};

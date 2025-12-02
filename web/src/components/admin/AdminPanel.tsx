import { useState } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export function AdminPanel() {
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            // Replace with your actual endpoint
            await axios.post('http://localhost:8000/admin/action', { value: inputValue })
            alert('Submitted successfully!')
            setInputValue('')
        } catch (error) {
            console.error('Error submitting form:', error)
            alert('Failed to submit')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex justify-center items-center min-h-[50vh] p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Admin Action</CardTitle>
                    <CardDescription>Enter a value to perform the admin action.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="admin-input">Input Value</Label>
                            <Input
                                id="admin-input"
                                placeholder="Enter string..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                required
                                className="w-full"
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Submitting...' : 'Submit Action'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"

interface DbCheckResult {
  status: string
  timestamp: string
  tables: Record<string, { exists: boolean; rowCount?: number }>
  extensions: Record<string, boolean>
  errors: string[]
}

export default function CheckDatabasePage() {
  const [result, setResult] = useState<DbCheckResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkDatabase = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/check-db")
      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to check database")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to API")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkDatabase()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-6 w-6 text-green-600" />
      case "warning":
        return <AlertCircle className="h-6 w-6 text-yellow-600" />
      case "error":
        return <XCircle className="h-6 w-6 text-red-600" />
      default:
        return <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-4">
        <BackButton href="/admin/login" label="Back to Admin" />
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Database Status Check</h1>
        <p className="text-muted-foreground">
          Verify that all required database tables and extensions are properly set up
        </p>
      </div>

      {loading && !result && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg">Checking database...</span>
          </CardContent>
        </Card>
      )}

      {error && !result && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <XCircle className="h-6 w-6" />
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={checkDatabase} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                Overall Status
              </CardTitle>
              <CardDescription>Last checked: {new Date(result.timestamp).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge className={getStatusColor(result.status)}>{result.status.toUpperCase()}</Badge>
              <Button onClick={checkDatabase} variant="outline" size="sm" className="ml-4 bg-transparent">
                Refresh
              </Button>
            </CardContent>
          </Card>

          {/* Extensions */}
          <Card>
            <CardHeader>
              <CardTitle>PostgreSQL Extensions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(result.extensions).map(([name, enabled]) => (
                  <div key={name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">{name}</span>
                    {enabled ? (
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Not Enabled</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tables */}
          <Card>
            <CardHeader>
              <CardTitle>Database Tables</CardTitle>
              <CardDescription>Required tables for the application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(result.tables).map(([name, info]) => (
                  <div key={name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {info.exists ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">{name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {info.exists && info.rowCount !== undefined && (
                        <span className="text-sm text-muted-foreground">{info.rowCount} rows</span>
                      )}
                      <Badge className={info.exists ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {info.exists ? "Exists" : "Missing"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Errors */}
          {result.errors.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-6 w-6" />
                  Issues Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-yellow-700">
                  {result.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {result.status === "success" && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-green-800">
                  <CheckCircle2 className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">Database is properly configured!</p>
                    <p className="text-sm text-green-700">All required tables and extensions are in place.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

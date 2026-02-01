# Setup Vercel Environment Variables for API
Write-Host "Setting up Vercel environment variables for API..." -ForegroundColor Green

# CORS Origins
$corsOrigins = "https://chopchop.space,https://menuverse.space,https://delivermi.space,https://ridermi.space,https://chop-chop.vercel.app,https://menuverse.vercel.app,https://deliver-mi.vercel.app,https://rider-mi.vercel.app"
Write-Host "Adding CORS_ORIGINS..." -ForegroundColor Yellow
echo $corsOrigins | vercel env add CORS_ORIGINS production

# Firebase Configuration
Write-Host "Adding Firebase configuration..." -ForegroundColor Yellow
echo "chopchop-67750" | vercel env add FIREBASE_PROJECT_ID production
echo "firebase-adminsdk-fbsvc@chopchop-67750.iam.gserviceaccount.com" | vercel env add FIREBASE_CLIENT_EMAIL production

# Firebase Private Key (multiline)
$firebaseKey = @"
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC/lKyvkD6uI17v
pZIVCR6WvlVh68FxNKEFjY+RBCRQMhSX6KTncmSu0c3C38MGKQIxl3lnso3VkiLY
/PxRexQDlKvzJve3W1qahDxbdv6YS2GX8/7ByHYLHUVrFRtuUlSdPEW4Ecp/3y74
1mi+LExSmYxO85ZbLI21HdLP9SL46r74ZM0w0Y0OxHNup48wqtmVl1gxnPmUlrnJ
D6FCATd26DKl0Kubqlb4xOXgX11UF/d0h46E8TxzdckuSV5Xj0fOzSrmT8KKeQrh
V2mbYpmLfwl7cXNP+BIMsQC9EfvNKwbLyh6uBvx5CdoS26qvNVSogm9cQ/Z4RheO
WC9QDEAXAgMBAAECggEAL1hKpMh89QQAvjCovVIXoSFAcIaWs6dR89FcHXZskvUN
ac0wk5INl7Z5pyMtSyRvSloowpu5uYH34rACmxBTjd7774c9yK5m4bC0SdZKbNCU
Ob0uxC0KHw0IzsHUmZr3FjSC9k5PQPKi5RP3pqfD5NXVet1v1vBXxN6t7n6iOek7
5JNVM0VPIAkUeYcV20k7CVvCRFy3RfEe1BExIl23sJuKeFXfAoLga6u4ULOE36N5
S466AUft/r2oiwiJxZvwF9dTnn1N9u52/JarQRU9AO8UIuhzLeGt/G9qiOtV0JFv
JvOHo55Y5EfcW++ZWtPyo+7U1ueBqxYCu4kDAr80IQKBgQDmfik63L2ESbXidF/4
mS/ImMfwAljXomW0o98sL1RQUNb7KVLuTu4tAemMBoTRSORiJSQ531EJuq5ZmDq2
bxdNb469wI89FwK2805CKYjegXZF4lEEAu7WQG0TfOxsTBe4tmumDydtleKNeGQ1
KLZjgd34GI2Xdx0kWORt4LNplQKBgQDUyCOEkT2pd7qYRUWjU2a7+Lg1igLDYcc7
T4zPjjx0nE+ih2x9Pwxp+LArDrZ7zuD++admWZkg2Zk6t/4DzdLejmtTMkGOrZ91
Ey+pL/Y2W5gEHrZ/xBN6a8LWKv/2HuXp3W9wGT8Vc+2QcpJvm2clYIiia4n6Tv7g
V9nTFCQP+wKBgCT5XgHMQTaEYIH4KyEE6c5i+8e7iKbmrSwCEZ3T5dGQdjwKD/yc
esaLhPxqW0n7SG+aB6qk8Sn/YVKMAfcb8QACAkLcLd4d39ibRRWF9ifDWsaxHE/p
bIjAAv9aTc69khyWXsRfr/J7VcFd660/X6qsvX+76JLAj9Mx00rw/bbVAoGAQaIG
SqLeSUK0HLnpVAqqurpqX6FVXtzvLl1IStFN1o5Mhg6NqUhkVN+vv2hHY4MZpaxu
NUTX1ekouZL9WEEJlTqK4luzGwZ1FBC5987ifDvedQ7gLiLV+0H4FEWpNEqtkmiK
MiKncb+TfKXKg4CE3WOcYbUYF0x8k8ilWNVyljcCgYEAidTJzxdXtdGaYTVzBLAi
Syu7HCLdMHAQ/As47jQ8TUpdBxIeLMU8vozoKffAezgmFnsnQ2tWf/oS+xKZ5TkT
KQ5C6w4KM1tBJH9j+iJGt46IjBrhIdHsLKD88sueQkTRdURBYOzkXZwd79w8CGXH
pDmJAYovLkaWS/zEmGqSosI=
-----END PRIVATE KEY-----
"@
echo $firebaseKey | vercel env add FIREBASE_PRIVATE_KEY production

# App URLs
Write-Host "Adding app URLs..." -ForegroundColor Yellow
echo "https://delivermi.space" | vercel env add DELIVERMI_URL production
echo "https://chopchop.space" | vercel env add CHOPCHOP_URL production
echo "https://menuverse.space" | vercel env add MENUVERSE_URL production
echo "https://ridermi.space" | vercel env add RIDERMI_URL production

# Supabase Configuration
Write-Host "Adding Supabase configuration..." -ForegroundColor Yellow
echo "https://jwkcvqfevkbribdvlyvo.supabase.co" | vercel env add SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2N2cWZldmticmliZHZseXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjkwMjUsImV4cCI6MjA4MzA0NTAyNX0.LGHFUdRyr15s9ykLkob1gUdh66bWKR2VIPlGOmd5A9E" | vercel env add SUPABASE_ANON_KEY production

Write-Host "Environment variables setup complete!" -ForegroundColor Green
Write-Host "Now deploying API to production..." -ForegroundColor Yellow
vercel --prod
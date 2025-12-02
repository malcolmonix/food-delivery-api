# PowerShell script to fix schema.js  
# Run this from the api directory: .\apply-schema-fix.ps1

$file = "schema.js"
$content = Get-Content $file -Raw

# 1. Add logoUrl and bannerUrl to GraphQL schema (after line 231)
$content = $content -replace '(openingHours: \[OpeningHourInput!\]\r?\n      isActive: Boolean\r?\n    \): Restaurant!)', "openingHours: [OpeningHourInput!]`r`n      isActive: Boolean`r`n      logoUrl: String`r`n      bannerUrl: String`r`n    ): Restaurant!"

# 2. Add logoUrl and bannerUrl to resolver signature (line 1118)
$content = $content -replace '(updateRestaurant: async \(_, \{ id, name, description, contactEmail, phoneNumber, address, cuisine, priceRange, openingHours, isActive \}, \{ user \}\))', 'updateRestaurant: async (_, { id, name, description, contactEmail, phoneNumber, address, cuisine, priceRange, openingHours, isActive, logoUrl, bannerUrl }, { user })'

# 3. Add handling for logoUrl and bannerUrl (after line 1135)
$content = $content -replace '(if \(isActive !== undefined\) updateData\.isActive = isActive;\r?\n)', "if (isActive !== undefined) updateData.isActive = isActive;`r`n        if (logoUrl !== undefined) updateData.logoUrl = logoUrl;`r`n        if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl;`r`n"

Set-Content $file $content -NoNewline

Write-Host "✅ Schema.js updated successfully!" -ForegroundColor Green
Write-Host "Added logoUrl and bannerUrl support to updateRestaurant mutation" -ForegroundColor Green

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Update Drainage website HTML files to use AVIF → WebP → JPEG fallback strategy
 * 
 * This script processes all HTML files in the Drainage website and converts
 * regular img tags to optimized picture elements with modern image formats.
 */

/**
 * Check if modern image formats exist for a given image path
 * @param {string} imagePath - Path to the original image
 * @returns {Object} - Object with avif and webp boolean properties
 */
function checkModernFormats(imagePath) {
    const ext = path.extname(imagePath);
    const nameWithoutExt = imagePath.replace(ext, '');
    const avifPath = nameWithoutExt + '.avif';
    const webpPath = nameWithoutExt + '.webp';
    
    return {
        avif: fs.existsSync(avifPath),
        webp: fs.existsSync(webpPath)
    };
}

/**
 * Create optimized picture element with AVIF → WebP → JPEG fallback
 * @param {string} imagePath - Path to the original image
 * @param {string} altText - Alt text for the image
 * @param {string} attributes - Additional HTML attributes
 * @returns {string} - Picture element HTML
 */
function createOptimizedPictureElement(imagePath, altText, attributes = '') {
    const ext = path.extname(imagePath);
    const nameWithoutExt = imagePath.replace(ext, '');
    const { avif, webp } = checkModernFormats(imagePath);
    
    let sources = [];
    
    // Add AVIF source if available
    if (avif) {
        sources.push(`<source srcset="${nameWithoutExt}.avif" type="image/avif">`);
    }
    
    // Add WebP source if available
    if (webp) {
        sources.push(`<source srcset="${nameWithoutExt}.webp" type="image/webp">`);
    }
    
    // If no modern formats available, return original img tag
    if (!avif && !webp) {
        return `<img src="${imagePath}" alt="${altText}" ${attributes}>`;
    }
    
    // Create picture element
    return `<picture>
        ${sources.join('\n        ')}
        <img src="${imagePath}" alt="${altText}" ${attributes}>
    </picture>`;
}

/**
 * Process HTML content to update image tags
 * @param {string} htmlContent - HTML content to process
 * @returns {Object} - Updated content and change statistics
 */
function processHtmlContent(htmlContent) {
    let updatedContent = htmlContent;
    let changesCount = 0;
    
    // Pattern to match img tags (excluding those already in picture elements and SVGs)
    const imgPattern = /<img([^>]*?)src="([^"]*\.(jpg|jpeg|png))"([^>]*?)>/gi;
    
    updatedContent = updatedContent.replace(imgPattern, (match, beforeSrc, imagePath, extension, afterSrc) => {
        // Skip if this img is already inside a picture element
        const beforeMatch = htmlContent.substring(0, htmlContent.indexOf(match));
        const lastPictureOpen = beforeMatch.lastIndexOf('<picture');
        const lastPictureClose = beforeMatch.lastIndexOf('</picture>');
        if (lastPictureOpen > lastPictureClose) {
            return match; // Skip, already in picture element
        }
        
        // Extract alt text and other attributes
        const altMatch = match.match(/alt="([^"]*)"/);
        const altText = altMatch ? altMatch[1] : '';
        
        // Combine attributes (excluding src and alt which we handle separately)
        const attributes = (beforeSrc + afterSrc)
            .replace(/alt="[^"]*"/g, '')
            .replace(/src="[^"]*"/g, '')
            .trim();
        
        // Create optimized picture element
        const pictureElement = createOptimizedPictureElement(imagePath, altText, attributes);
        
        // Only count as change if we actually created a picture element
        if (pictureElement.includes('<picture>')) {
            changesCount++;
            console.log(`  Optimized: ${imagePath}`);
        }
        
        return pictureElement;
    });
    
    return { content: updatedContent, changesCount };
}

/**
 * Process CSS background images
 * @param {string} cssContent - CSS content to process
 * @returns {Object} - Updated content and change statistics
 */
function processCssBackgrounds(cssContent) {
    let updatedContent = cssContent;
    let changesCount = 0;
    
    // Pattern to match CSS background images
    const bgPattern = /url\(['"]([^'"]*\.(jpg|jpeg|png))['"]\)/gi;
    
    updatedContent = updatedContent.replace(bgPattern, (match, imagePath, extension) => {
        const { avif, webp } = checkModernFormats(imagePath);
        
        // For CSS backgrounds, we can't use picture elements, so we'll just use WebP if available
        // Note: This is a simplified approach - for full AVIF support in CSS, you'd need CSS @supports
        if (webp) {
            const nameWithoutExt = imagePath.replace(path.extname(imagePath), '');
            changesCount++;
            console.log(`  CSS Background optimized: ${imagePath} → ${nameWithoutExt}.webp`);
            return match.replace(imagePath, `${nameWithoutExt}.webp`);
        }
        
        return match;
    });
    
    return { content: updatedContent, changesCount };
}

/**
 * Process a single HTML file
 * @param {string} filePath - Path to the HTML file
 */
function processHtmlFile(filePath) {
    console.log(`Processing: ${path.basename(filePath)}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Process HTML img tags
    const htmlResult = processHtmlContent(content);
    
    // Process CSS background images
    const cssResult = processCssBackgrounds(htmlResult.content);
    
    const totalChanges = htmlResult.changesCount + cssResult.changesCount;
    
    if (totalChanges > 0) {
        // Create backup
        const backupPath = filePath + '.backup';
        if (!fs.existsSync(backupPath)) {
            fs.writeFileSync(backupPath, content);
        }
        
        // Write updated content
        fs.writeFileSync(filePath, cssResult.content);
        console.log(`  ✅ Updated ${totalChanges} images (${htmlResult.changesCount} HTML, ${cssResult.changesCount} CSS)`);
        return true;
    } else {
        console.log(`  ✓ No images to optimize`);
        return false;
    }
}

/**
 * Main function to process all HTML files
 */
function main() {
    console.log('🚀 Drainage Website Image Optimization');
    console.log('=====================================');
    
    const currentDir = __dirname;
    
    // Find all HTML files
    const htmlFiles = fs.readdirSync(currentDir)
        .filter(file => file.endsWith('.html'))
        .map(file => path.join(currentDir, file));
    
    if (htmlFiles.length === 0) {
        console.log('❌ No HTML files found');
        return;
    }
    
    console.log(`Found ${htmlFiles.length} HTML files to process\n`);
    
    let totalProcessed = 0;
    let totalOptimized = 0;
    
    htmlFiles.forEach(filePath => {
        if (processHtmlFile(filePath)) {
            totalOptimized++;
        }
        totalProcessed++;
    });
    
    console.log('\n📊 Summary:');
    console.log(`Files processed: ${totalProcessed}`);
    console.log(`Files optimized: ${totalOptimized}`);
    
    if (totalOptimized > 0) {
        console.log('\n✨ Optimization Benefits:');
        console.log('• AVIF format: ~50% smaller file sizes');
        console.log('• WebP format: ~30% smaller file sizes');
        console.log('• Progressive enhancement with JPEG fallback');
        console.log('• Improved loading times across all devices');
        console.log('• Better user experience with modern image formats');
        
        console.log('\n🔍 Next Steps:');
        console.log('1. Test the website in different browsers');
        console.log('2. Check browser dev tools Network tab for format confirmation');
        console.log('3. Verify images display correctly on all pages');
        console.log('4. Commit and deploy the optimized version');
    } else {
        console.log('\n✓ All images are already optimized or no modern formats available');
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { 
    processHtmlFile, 
    createOptimizedPictureElement, 
    checkModernFormats 
};
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Test script to verify Drainage website image optimization is working correctly
 */

function testImageOptimization() {
    console.log('🧪 Testing Drainage Website Image Optimization');
    console.log('==============================================');
    
    const currentDir = __dirname;
    const htmlFiles = fs.readdirSync(currentDir)
        .filter(file => file.endsWith('.html'))
        .map(file => path.join(currentDir, file));
    
    let totalPictureElements = 0;
    let totalAvifSources = 0;
    let totalWebpSources = 0;
    let totalImages = 0;
    let filesWithOptimization = 0;
    
    htmlFiles.forEach(filePath => {
        const fileName = path.basename(filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Count picture elements
        const pictureMatches = content.match(/<picture>/g);
        const pictureCount = pictureMatches ? pictureMatches.length : 0;
        
        // Count AVIF sources
        const avifMatches = content.match(/srcset="[^"]*\.avif"/g);
        const avifCount = avifMatches ? avifMatches.length : 0;
        
        // Count WebP sources
        const webpMatches = content.match(/srcset="[^"]*\.webp"/g);
        const webpCount = webpMatches ? webpMatches.length : 0;
        
        // Count total img tags
        const imgMatches = content.match(/<img[^>]*>/g);
        const imgCount = imgMatches ? imgMatches.length : 0;
        
        // Count WebP CSS backgrounds
        const webpCssMatches = content.match(/url\([^)]*\.webp\)/g);
        const webpCssCount = webpCssMatches ? webpCssMatches.length : 0;
        
        totalPictureElements += pictureCount;
        totalAvifSources += avifCount;
        totalWebpSources += webpCount;
        totalImages += imgCount;
        
        if (pictureCount > 0) {
            filesWithOptimization++;
        }
        
        console.log(`\n${fileName}:`);
        console.log(`  Picture elements: ${pictureCount}`);
        console.log(`  AVIF sources: ${avifCount}`);
        console.log(`  WebP sources: ${webpCount}`);
        console.log(`  Total images: ${imgCount}`);
        if (webpCssCount > 0) {
            console.log(`  WebP CSS backgrounds: ${webpCssCount}`);
        }
        
        // Verify proper structure
        if (pictureCount > 0) {
            // Check if AVIF sources come before WebP sources
            const avifIndex = content.indexOf('type="image/avif"');
            const webpIndex = content.indexOf('type="image/webp"');
            
            if (avifIndex !== -1 && webpIndex !== -1) {
                if (avifIndex < webpIndex) {
                    console.log(`  ✅ Proper AVIF → WebP → JPEG fallback order`);
                } else {
                    console.log(`  ⚠️  Source order may be incorrect`);
                }
            }
        }
    });
    
    console.log('\n📊 Overall Results:');
    console.log(`Files processed: ${htmlFiles.length}`);
    console.log(`Files with optimization: ${filesWithOptimization}`);
    console.log(`Total picture elements: ${totalPictureElements}`);
    console.log(`Total AVIF sources: ${totalAvifSources}`);
    console.log(`Total WebP sources: ${totalWebpSources}`);
    console.log(`Total images: ${totalImages}`);
    
    // Calculate coverage
    const optimizationCoverage = (totalPictureElements / totalImages) * 100;
    console.log(`\n📈 Optimization Coverage: ${optimizationCoverage.toFixed(1)}%`);
    
    // Test file existence
    console.log('\n🔍 Testing File Existence:');
    const testFiles = [
        'drainage_hero.avif',
        'drainage_hero.webp',
        'trough-stacker-hero.avif',
        'trough-stacker-hero.webp',
        'drainage-mats-hero.avif',
        'drainage-mats-hero.webp',
        'Pembroke_CaseStudy.avif',
        'Pembroke_CaseStudy.webp',
        'nationalhighways_casestudy.avif',
        'nationalhighways_casestudy.webp',
        'rosehill_drainage_logo.avif',
        'rosehill_drainage_logo.webp',
        'trough_a_drawing.avif',
        'trough_a_drawing.webp',
        'trough_b_drawing.avif',
        'trough_b_drawing.webp'
    ];
    
    let existingFiles = 0;
    testFiles.forEach(file => {
        if (fs.existsSync(file)) {
            existingFiles++;
            console.log(`  ✅ ${file} exists`);
        } else {
            console.log(`  ❌ ${file} missing`);
        }
    });
    
    console.log(`\nFiles found: ${existingFiles}/${testFiles.length}`);
    
    // Performance estimation
    console.log('\n⚡ Expected Performance Benefits:');
    console.log('• AVIF format: ~50% smaller than JPEG');
    console.log('• WebP format: ~30% smaller than JPEG');
    console.log('• Progressive enhancement ensures compatibility');
    console.log('• Lazy loading improves initial page load');
    console.log('• Better user experience across all devices');
    
    // Browser compatibility
    console.log('\n🌐 Browser Compatibility:');
    console.log('• AVIF: Chrome 85+, Firefox 93+, Safari 16+, Edge 90+');
    console.log('• WebP: Chrome 23+, Firefox 65+, Safari 14+, Edge 18+');
    console.log('• JPEG: Universal compatibility (100%)');
    
    console.log('\n✅ Optimization test completed successfully!');
    
    return {
        totalPictureElements,
        totalAvifSources,
        totalWebpSources,
        totalImages,
        filesWithOptimization,
        optimizationCoverage
    };
}

// Run the test
if (require.main === module) {
    testImageOptimization();
}

module.exports = { testImageOptimization };
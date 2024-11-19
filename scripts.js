function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function formatChineseDate(dateStr) {
    const date = dayjs(dateStr);
    return `${date.year()}年${date.month() + 1}月${date.date()}日`;
}

function getDateStatus(dateStr) {
    const today = dayjs().startOf('day');
    const date = dayjs(dateStr).startOf('day');
    const nextWeek = today.add(7, 'day');

    if (date.isBefore(today)) {
        return 'passed';
    } else if (date.isAfter(today) && date.isBefore(nextWeek)) {
        return 'upcoming';
    }
    return 'future';
}

// Update only this function in scripts.js
function renderTimelineItem(dateStr, text) {
    const status = getDateStatus(dateStr);
    return `
        <div class="timeline-item ${status}">
            <span class="date">${text}</span>
            <span>${formatChineseDate(dateStr)}</span>
            <span class="date-tag ${status}">
                ${status === 'passed' ? '已完成' : 
                  status === 'upcoming' ? '进行中' : '待开始'}
            </span>
        </div>
    `;
}

// Also update this function
function renderTimelinePeriod(periodStr, text) {
    const [startDate, endDate] = periodStr.split('-').map(d => d.trim());
    const status = getDateStatus(endDate);
    return `
        <div class="timeline-item ${status}">
            <span class="date">${text}</span>
            <span>${formatChineseDate(startDate)} - ${formatChineseDate(endDate)}</span>
            <span class="date-tag ${status}">
                ${status === 'passed' ? '已完成' : 
                  status === 'upcoming' ? '进行中' : '待开始'}
            </span>
        </div>
    `;
}

async function loadStudentData() {
    const stuid = getUrlParameter('stuid');
    if (!stuid) {
        document.getElementById('content').innerHTML = '<div class="error-message">错误：未提供学生ID</div>';
        return;
    }

    try {
        const response = await fetch(`./stu/${stuid}.json`); // Updated path
        if (!response.ok) {
            throw new Error(`无法加载数据`);
        }

        const data = await response.json();
        const content = `
            <div class="student-info">
                <div class="label">学号：</div>
                <div>${data.stuid}</div>
                <div class="label">姓名：</div>
                <div>${data.name}</div>
                <div class="label">年级：</div>
                <div>${data.grade}</div>
                <div class="label">项目题目：</div>
                <div>${data.title}</div>
                <div class="label">项目进度：</div>
                <div><span class="status">${data.status}</span></div>
            </div>

            <div class="section">
                <div class="section-title">项目开发与发布</div>
                ${renderTimelineItem(data.projectStartDate, '项目立项')}
                ${renderTimelineItem(data.completionDate, '预计开发完成')}
                ${renderTimelineItem(data.releaseDate, '预计项目发布')}
            </div>

            <div class="section">
                <div class="section-title">论文与专利</div>
                ${renderTimelineItem(data.paperPeriod, '论文辅导与发表')}
                ${renderTimelineItem(data.patentPeriod, '专利辅导与发表')}
            </div>

            <div class="section">
                <div class="section-title">竞赛任务</div>
                ${data.competitions.map(comp => 
                    renderTimelineItem(comp.date, comp.name)
                ).join('')}
            </div>

            <div class="section">
                <div class="section-title">项目推广计划</div>
                ${renderTimelineItem(data.promotionDate, '推广计划')}
                ${renderTimelineItem(data.registrationDate, '公司或非盈利注册')}
                ${renderTimelineItem(data.websiteDate, '网站上线')}
            </div>

            <div class="section">
                <div class="section-title">义工任务</div>
                ${data.volunteerWork.activities.map(activity => 
                    renderTimelineItem(activity.date, activity.name)
                ).join('')}
            </div>

            <div class="section">
                <div class="section-title">项目总结</div>
                ${renderTimelineItem(data.projectSummary.recommendationLetter, '教授推荐信')}
                ${renderTimelineItem(data.projectSummary.applicationSupport, '申请活动辅助')}
                ${renderTimelineItem(data.projectSummary.finalSummary, '项目总结')}
            </div>
        `;
        
        document.getElementById('content').innerHTML = content;
    } catch (error) {
        document.getElementById('content').innerHTML = `<div class="error-message">错误：${error.message}</div>`;
    }
}

// Add this helper function for formatted date
function getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Update the export functions
async function exportToPDF() {
    const element = document.getElementById('report-container');
    const loadingOverlay = document.getElementById('loading-overlay');
    const studentName = document.querySelector('.student-info div:nth-child(4)').textContent; // Get student name
    const dateStr = getFormattedDate();
    
    loadingOverlay.style.display = 'flex';

    const options = {
        margin: 10,
        filename: `${studentName}-${dateStr}-项目进度报告.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        }
    };

    try {
        await html2pdf().set(options).from(element).save();
    } catch (error) {
        alert('导出PDF时发生错误，请重试');
        console.error('PDF export error:', error);
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

async function exportToImage() {
    const element = document.getElementById('report-container');
    const loadingOverlay = document.getElementById('loading-overlay');
    const studentName = document.querySelector('.student-info div:nth-child(4)').textContent; // Get student name
    const dateStr = getFormattedDate();
    
    loadingOverlay.style.display = 'flex';

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false
        });

        const link = document.createElement('a');
        link.download = `${studentName}-${dateStr}-项目进度报告.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        alert('导出图片时发生错误，请重试');
        console.error('Image export error:', error);
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', loadStudentData);



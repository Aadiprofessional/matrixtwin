import React from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import * as RiIcons from 'react-icons/ri';
import { Card } from '../ui/Card';

interface ReportTableColumn {
  key: string;
  label: string;
}

interface FullReportTheme {
  cardBorder: string;
  cardSurface: string;
  accentText: string;
  numberText: string;
}

interface FullReportContentProps {
  generatedOn: string;
  projectName: string;
  summaryCards: Array<{
    label: string;
    value: string | number;
  }>;
  reportHighlights: string[];
  statusChartTitle?: string;
  trendChartTitle?: string;
  contributorChartTitle?: string;
  weatherChartTitle?: string;
  statusChartData: any;
  trendChartData: any;
  contributorChartData: any;
  weatherChartData: any;
  chartOptions: any;
  issueSectionTitle?: string;
  issueColumns: ReportTableColumn[];
  issueRows: Record<string, any>[];
  issueEmptyText?: string;
  listSectionTitle?: string;
  listColumns: ReportTableColumn[];
  listRows: Record<string, any>[];
  theme?: Partial<FullReportTheme>;
}

const defaultTheme: FullReportTheme = {
  cardBorder: 'border-[#dbe5c4] dark:border-dark-700',
  cardSurface: 'bg-[#f7faef] dark:bg-dark-800',
  accentText: 'text-[#647f31]',
  numberText: 'text-[#2f3a17] dark:text-[#dbe5c4]'
};

export const FullReportContent: React.FC<FullReportContentProps> = ({
  generatedOn,
  projectName,
  summaryCards,
  reportHighlights,
  statusChartTitle = 'Status Distribution',
  trendChartTitle = 'Entries Over Time',
  contributorChartTitle = 'Top Contributors',
  weatherChartTitle = 'Category Distribution',
  statusChartData,
  trendChartData,
  contributorChartData,
  weatherChartData,
  chartOptions,
  issueSectionTitle = 'Issue Details',
  issueColumns,
  issueRows,
  issueEmptyText = 'No issues found in the currently listed entries.',
  listSectionTitle = 'Full List',
  listColumns,
  listRows,
  theme
}) => {
  const mergedTheme = { ...defaultTheme, ...theme };

  return (
    <div className="space-y-6 rounded-2xl border border-[#cbdcab]/60 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-900 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Generated On</div>
          <div className="text-base font-semibold text-secondary-900 dark:text-white">{generatedOn}</div>
        </div>
        <div className="text-sm text-secondary-600 dark:text-secondary-300">
          Project: <span className="font-semibold text-secondary-900 dark:text-white">{projectName}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {summaryCards.map((card, index) => (
          <div key={`${card.label}-${index}`} className={`rounded-xl border p-4 ${mergedTheme.cardBorder} ${mergedTheme.cardSurface}`}>
            <div className={`text-xs uppercase tracking-wide ${mergedTheme.accentText}`}>{card.label}</div>
            <div className={`mt-1 text-2xl font-semibold ${mergedTheme.numberText}`}>{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border border-[#dbe5c4] p-4 dark:border-dark-700">
          <div className="mb-3 flex items-center text-sm font-semibold text-secondary-800 dark:text-secondary-100">
            <RiIcons.RiPieChartLine className="mr-2 text-[#647f31]" />
            {statusChartTitle}
          </div>
          <div className="h-[300px]">
            <Doughnut data={statusChartData} options={{ ...chartOptions, scales: undefined as any }} />
          </div>
        </Card>
        <Card className="border border-[#dbe5c4] p-4 dark:border-dark-700">
          <div className="mb-3 flex items-center text-sm font-semibold text-secondary-800 dark:text-secondary-100">
            <RiIcons.RiLineChartLine className="mr-2 text-[#647f31]" />
            {trendChartTitle}
          </div>
          <div className="h-[300px]">
            <Line data={trendChartData} options={chartOptions} />
          </div>
        </Card>
        <Card className="border border-[#dbe5c4] p-4 dark:border-dark-700">
          <div className="mb-3 flex items-center text-sm font-semibold text-secondary-800 dark:text-secondary-100">
            <RiIcons.RiBarChartLine className="mr-2 text-[#647f31]" />
            {contributorChartTitle}
          </div>
          <div className="h-[300px]">
            <Bar data={contributorChartData} options={chartOptions} />
          </div>
        </Card>
        <Card className="border border-[#dbe5c4] p-4 dark:border-dark-700">
          <div className="mb-3 flex items-center text-sm font-semibold text-secondary-800 dark:text-secondary-100">
            <RiIcons.RiCloudyLine className="mr-2 text-[#647f31]" />
            {weatherChartTitle}
          </div>
          <div className="h-[300px]">
            <Bar data={weatherChartData} options={chartOptions} />
          </div>
        </Card>
      </div>

      <Card className="border border-[#dbe5c4] p-4 dark:border-dark-700">
        <div className="mb-3 flex items-center text-sm font-semibold text-secondary-800 dark:text-secondary-100">
          <RiIcons.RiSparklingLine className="mr-2 text-[#647f31]" />
          Report Highlights
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {reportHighlights.map((item, index) => (
            <div key={`${item}-${index}`} className="rounded-lg border border-[#e2ebcf] bg-[#f7faef] px-3 py-2 text-sm text-secondary-700 dark:border-dark-700 dark:bg-dark-800 dark:text-secondary-200">
              {item}
            </div>
          ))}
        </div>
      </Card>

      <Card className="border border-[#dbe5c4] p-4 dark:border-dark-700">
        <div className="mb-3 flex items-center text-sm font-semibold text-secondary-800 dark:text-secondary-100">
          <RiIcons.RiAlertLine className="mr-2 text-[#647f31]" />
          {issueSectionTitle}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#dbe5c4] dark:border-dark-700">
                {issueColumns.map((column) => (
                  <th key={column.key} className="px-3 py-2 font-semibold text-secondary-700 dark:text-secondary-200">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {issueRows.length > 0 ? issueRows.map((row, rowIndex) => (
                <tr key={row.id || `issue-row-${rowIndex}`} className="border-b border-[#edf3df] align-top dark:border-dark-800">
                  {issueColumns.map((column) => (
                    <td key={`${row.id || rowIndex}-${column.key}`} className="px-3 py-2 text-secondary-700 dark:text-secondary-300">
                      {row[column.key] || '-'}
                    </td>
                  ))}
                </tr>
              )) : (
                <tr>
                  <td colSpan={issueColumns.length} className="px-3 py-3 text-center text-secondary-500 dark:text-secondary-400">
                    {issueEmptyText}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border border-[#dbe5c4] p-4 dark:border-dark-700">
        <div className="mb-3 flex items-center text-sm font-semibold text-secondary-800 dark:text-secondary-100">
          <RiIcons.RiFileList3Line className="mr-2 text-[#647f31]" />
          {listSectionTitle}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#dbe5c4] dark:border-dark-700">
                {listColumns.map((column) => (
                  <th key={column.key} className="px-3 py-2 font-semibold text-secondary-700 dark:text-secondary-200">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listRows.map((row, rowIndex) => (
                <tr key={row.id || `report-row-${rowIndex}`} className="border-b border-[#edf3df] align-top dark:border-dark-800">
                  {listColumns.map((column) => (
                    <td key={`${row.id || rowIndex}-${column.key}`} className="px-3 py-2 text-secondary-700 dark:text-secondary-300">
                      {row[column.key] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

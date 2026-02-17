import React from 'react';
import { formatMonthYear } from '../utils/dateUtils';

export default function FilterBar({ months, boroughs, offenceGroups, filters, onFilterChange, showEndDate = true }) {

    const handleChange = (key, value) => {
        onFilterChange(prev => ({
            ...prev,
            [key]: value
        }));
    };

    return (
        <div className="filter-bar" style={{ display: 'flex', gap: '10px', padding: '0', marginBottom: '20px', flexWrap: 'wrap' }}>



            {/* Start Date / Month */}
            <select
                value={filters.start_date || ''}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className="custom-select"
            >
                <option value="">{showEndDate ? 'Start Date' : 'Select Month'}</option>
                {months.map(m => (
                    <option key={m} value={m}>{formatMonthYear(m)}</option>
                ))}
            </select>

            {/* End Date — only shown when showEndDate is true */}
            {showEndDate && (
                <select
                    value={filters.end_date || ''}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                    className="custom-select"
                >
                    <option value="">End Date</option>
                    {months.map(m => (
                        <option key={m} value={m}>{formatMonthYear(m)}</option>
                    ))}
                </select>
            )}

            {/* Borough */}
            <select
                value={filters.borough || ''}
                onChange={(e) => handleChange('borough', e.target.value)}
                className="custom-select"
            >
                <option value="">All Boroughs</option>
                {boroughs.map(b => (
                    <option key={b} value={b}>{b}</option>
                ))}
            </select>

            {/* Offence Group */}
            <select
                value={filters.offence_group || ''}
                onChange={(e) => handleChange('offence_group', e.target.value)}
                className="custom-select"
            >
                <option value="">All Crime Types</option>
                {offenceGroups.map(g => (
                    <option key={g} value={g}>{g}</option>
                ))}
            </select>

        </div>
    );
}

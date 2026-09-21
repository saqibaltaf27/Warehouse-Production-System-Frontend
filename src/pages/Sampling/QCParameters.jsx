import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Table from '../../global-components/Table/Table';
import Button from '../../global-components/Button/Button';
import ChooseFromList from '../../global-components/ChooseFromList/ChooseFromList';
import Select from 'react-select';
import toast from 'react-hot-toast';
import './Sampling.css';

const QCParameters = () => {
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [sampleQty, setSampleQty] = useState('');
  const [tableData, setTableData] = useState([]);
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [parameterOptions, setParameterOptions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/equipments`);
        if (res.data?.success) {
          setEquipmentOptions(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching equipments:", err);
      }
    };
    
    const fetchParameters = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/parameters`);
        if (res.data?.success) {
          setParameterOptions(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching parameters:", err);
      }
    };

    fetchEquipments();
    fetchParameters();
  }, []);

  const handleItemSelect = async (val, label, row) => {
    setItemCode(val);
    setItemName(label);
    if (val) {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/quality/item-by-code`, { params: { itemCode: val } });
        if (res.data?.success) {
          const itemData = res.data.data;
          setSampleQty(itemData.U_SampleSize !== null ? String(itemData.U_SampleSize) : '1.0000');

          if (res.data.lines) {
            const mappedLines = res.data.lines.map((line, index) => ({
              'id': Date.now() + index,
              'Parameter Line': line.LineId,
              'Parameter Code': line.U_PrmCode || '',
              'Parameter Name': line.U_PrmName || '',
              'Action': line.U_Action || '',
              'Criteria': line.U_Criteria || '',
              'Equipment Code': line.U_EqpCode || '',
              'Equipment Name': line.U_EqpName || '',
              'UOM': line.U_PrmUom || '',
              'Std Value': line.U_StdValue || '',
              'Min Value': line.U_MinValue || '',
              'Max Value': line.U_MaxValue || '',
              'Type': line.U_Type || 'M'
            }));
            setTableData(mappedLines);
          } else {
            setTableData([]);
          }
        }
      } catch (err) {
        setSampleQty('1.0000');
        setTableData([]);
      }
    } else {
      setSampleQty('');
      setTableData([]);
    }
  };

  const handleAddRow = () => {
    const newRow = {
      'id': Date.now(),
      'Parameter Line': tableData.length + 1,
      'Parameter Code': '',
      'Parameter Name': '',
      'Action': '',
      'Criteria': '',
      'Equipment Code': '',
      'Equipment Name': '',
      'UOM': '',
      'Std Value': '',
      'Min Value': '',
      'Max Value': '',
      'Type': 'M'
    };
    setTableData([...tableData, newRow]);
  };

  const handleRemoveRow = (index) => {
    const newData = [...tableData];
    newData.splice(index, 1);
    newData.forEach((row, idx) => {
      row['Parameter Line'] = idx + 1;
    });
    setTableData(newData);
  };

  const handleSave = async () => {
    if (!itemCode) {
      toast.error("Please select an item first.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        itemCode,
        sampleSize: 0,
        lines: tableData
      };

      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/quality/save-qc-parameters`, payload);
      if (res.data?.success) {
        toast.success("QC Parameters saved successfully!");
      } else {
        toast.error(res.data?.message || "Failed to save QC parameters");
      }
    } catch (err) {
      console.error("Failed to save QC parameters:", err);
      toast.error(err.response?.data?.message || "Failed to save QC parameters");
    } finally {
      setIsSaving(false);
    }
  };

  const detailColumns = [
    { key: 'Parameter Line', header: '#' },
    { 
      key: 'Parameter Code', 
      header: 'Parameter Code',
      render: (row, rowIndex) => (
        <input 
          type="text" 
          value={row['Parameter Code'] || ''}
          onChange={(e) => {
            const newData = [...tableData];
            newData[rowIndex]['Parameter Code'] = e.target.value;
            setTableData(newData);
          }}
          disabled
          className="qc-param-input-disabled"
        />
      )
    },
    { 
      key: 'Parameter Name', 
      header: 'Parameter Name',
      render: (row, rowIndex) => {
        const selectedOption = parameterOptions.find(p => p.Name === row['Parameter Name'])
          ? { value: row['Parameter Name'], label: row['Parameter Name'] }
          : null;

        const options = parameterOptions.map(p => ({ value: p.Name, label: p.Name }));

        return (
          <div className="qc-param-select-wrapper">
            <Select 
              value={selectedOption}
              options={options}
              isClearable
              menuPortalTarget={document.body}
              menuPlacement="auto"
              onChange={(selected) => {
                const newData = [...tableData];
                if (selected) {
                  newData[rowIndex]['Parameter Name'] = selected.value;
                  const selectedParam = parameterOptions.find(p => p.Name === selected.value);
                  if (selectedParam) {
                    newData[rowIndex]['Parameter Code'] = selectedParam.Code;
                  }
                } else {
                  newData[rowIndex]['Parameter Name'] = '';
                  newData[rowIndex]['Parameter Code'] = '';
                }
                setTableData(newData);
              }}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '30px',
                  height: '30px',
                }),
                valueContainer: (base) => ({
                  ...base,
                  height: '30px',
                  padding: '0 6px'
                }),
                input: (base) => ({
                  ...base,
                  margin: '0px',
                }),
                indicatorSeparator: () => ({ display: 'none' }),
                indicatorsContainer: (base) => ({
                  ...base,
                  height: '30px',
                }),
                menuPortal: base => ({ ...base, zIndex: 9999 })
              }}
            />
          </div>
        );
      }
    },
    { 
      key: 'Criteria', 
      header: 'Criteria',
      render: (row, rowIndex) => (
        <textarea 
          rows={2}
          value={row['Criteria']}
          onChange={(e) => {
            const newData = [...tableData];
            newData[rowIndex]['Criteria'] = e.target.value;
            setTableData(newData);
          }}
          className="qc-param-textarea"
        />
      )
    },
    { 
      key: 'Action', 
      header: 'Action',
      render: (row, rowIndex) => (
        <textarea 
          rows={2}
          value={row['Action'] || ''}
          onChange={(e) => {
            const newData = [...tableData];
            newData[rowIndex]['Action'] = e.target.value;
            setTableData(newData);
          }}
          className="qc-param-textarea"
        />
      )
    },
    { 
      key: 'Equipment Code', 
      header: 'Equipment',
      render: (row, rowIndex) => (
        <select 
          value={row['Equipment Code'] || ''} 
          onChange={(e) => {
            const newData = [...tableData];
            newData[rowIndex]['Equipment Code'] = e.target.value;
            const selectedEqp = equipmentOptions.find(eq => eq.U_EqpCode === e.target.value);
            if (selectedEqp) {
              newData[rowIndex]['Equipment Name'] = selectedEqp.U_EqpName;
            }
            setTableData(newData);
          }}
          className="qc-param-select"
        >
          <option value="">-</option>
          {equipmentOptions.map((eq, i) => (
            <option key={i} value={eq.U_EqpCode}>
              {eq.U_EqpCode} - {eq.U_EqpName}
            </option>
          ))}
        </select>
      )
    },
    { 
      key: 'UOM', 
      header: 'UOM',
      render: (row, rowIndex) => (
        <input 
          type="text" 
          value={row['UOM']}
          onChange={(e) => {
            const newData = [...tableData];
            newData[rowIndex]['UOM'] = e.target.value;
            setTableData(newData);
          }}
          className="qc-param-input-small"
        />
      )
    },
    { 
      key: 'Std Value', 
      header: 'Std Value',
      render: (row, rowIndex) => (
        <input 
          type="text" 
          value={row['Std Value']}
          onChange={(e) => {
            const newData = [...tableData];
            newData[rowIndex]['Std Value'] = e.target.value;
            setTableData(newData);
          }}
          className="qc-param-input-medium"
        />
      )
    },
    { 
      key: 'Min Value', 
      header: 'Min Value',
      render: (row, rowIndex) => (
        <input 
          type="text" 
          value={row['Min Value']}
          onChange={(e) => {
            const newData = [...tableData];
            newData[rowIndex]['Min Value'] = e.target.value;
            setTableData(newData);
          }}
          className="qc-param-input-medium"
        />
      )
    },
    { 
      key: 'Max Value', 
      header: 'Max Value',
      render: (row, rowIndex) => (
        <input 
          type="text" 
          value={row['Max Value']}
          onChange={(e) => {
            const newData = [...tableData];
            newData[rowIndex]['Max Value'] = e.target.value;
            setTableData(newData);
          }}
          className="qc-param-input-medium"
        />
      )
    },
    { 
      key: 'Type', 
      header: 'Type',
      render: (row, rowIndex) => (
        <select 
          value={row.Type || 'M'} 
          onChange={(e) => {
            const newData = [...tableData];
            newData[rowIndex].Type = e.target.value;
            setTableData(newData);
          }}
          className="qc-param-input-default"
        >
          <option value="M">M - Material</option>
          <option value="P">P - Process</option>
        </select>
      )
    },
    {
      key: 'Actions',
      header: 'Actions',
      render: (row, rowIndex) => (
        <button 
          onClick={() => handleRemoveRow(rowIndex)}
          className="qc-param-remove-btn"
        >
          Remove
        </button>
      )
    }
  ];

  return (
    <div className="qc-sampling-container fade-in-up qc-sampling-container-inner">
      <div className="dome-card-wrapper qc-card-wrapper">
        <div className="qc-header-row">
          <h3 className="section-title">Manage QC Testing Standards</h3>
        </div>

        <div className="add-sample-grid" style={{ marginBottom: '24px' }}>
          <div className="add-sample-col">
            <div className="add-sample-field">
              <label className="add-sample-label">ItemCode</label>
              <div style={{ flex: 1 }}>
                <ChooseFromList
                  title="Select Item"
                  apiEndpoint={`${import.meta.env.VITE_API_BASE_URL}/quality/items`}
                  columns={[
                    { key: 'ItemCode', header: 'Item Code' },
                    { key: 'ItemName', header: 'Item Name' }
                  ]}
                  valueKey="ItemCode"
                  labelKey="ItemName"
                  value={itemCode}
                  displayValue={itemCode}
                  onChange={handleItemSelect}
                  placeholder="Search ItemCode..."
                />
              </div>
            </div>
            <div className="add-sample-field">
              <label className="add-sample-label">ItemName</label>
              <input type="text" className="add-sample-input" value={itemName} disabled />
            </div>
          </div>
        </div>

        <div className="qc-title-row">
          <h4 style={{ color: '#333', margin: 0 }}>Testing Parameters</h4>
        </div>

        <div className="add-sample-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
          <Table 
            data={tableData}
            columns={detailColumns}
            showActions={false}
            showPagination={false}
          />
        </div>
        
        <div className="qc-footer-row">
          <Button variant="secondary" onClick={handleAddRow} disabled={!itemCode}>
            Add Row
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!itemCode || isSaving}>
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QCParameters;

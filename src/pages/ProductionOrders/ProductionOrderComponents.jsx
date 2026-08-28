import React from 'react';

const ProductionOrderComponents = ({ componentsData, itemCode }) => {
  return (
    <>
      <div className="po-tabs">
        <div className="po-tab active">Components</div>
      </div>

      <div className="po-grid-container">
        <table className="po-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>No.</th>
              <th>Description</th>
              <th>Base Qty</th>
              <th>Base Ratio</th>
              <th>Planned Qty</th>
              <th>Issued</th>
              <th>Available</th>
              <th>Project</th>
              <th>UoM Code</th>
              <th>UoM Name</th>
              <th>Warehouse</th>
              <th>Issue Method</th>
              <th>WIP Account</th>
              <th>Department</th>
              <th>Business Segment</th>
              <th>Branch</th>
              <th>Route Sequence</th>
              <th>Procurement Doc.</th>
              <th>Allow Procurmt Doc.</th>
            </tr>
          </thead>
          <tbody>
            {componentsData && componentsData.length > 0 ? (
              componentsData.map((row, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className="po-icon-cell">
                    {row.Type === 'Route Stage' ? <span className="po-route-arrow-red">&rarr;</span> : <span className="po-route-arrow-yellow">&rarr;</span>}
                    {row.Type}
                  </td>
                  <td>{row.No}</td>
                  <td>{row.Description}</td>
                  <td>{row.BaseQty}</td>
                  <td>{row.BaseRatio}</td>
                  <td>{row.PlannedQty}</td>
                  <td>{row.Issued}</td>
                  <td>{row.Available}</td>
                  <td>{row.Project}</td>
                  <td>{row.UoMCode}</td>
                  <td>{row.UoMName}</td>
                  <td>{row.Warehouse}</td>
                  <td>{row.IssueMethod}</td>
                  <td>{row.WIPAccount}</td>
                  <td>{row.Department}</td>
                  <td>{row.BusinessSegment}</td>
                  <td>{row.Branch}</td>
                  <td>{row.RouteSequence}</td>
                  <td>{row.ProcurementDoc}</td>
                  <td>
                    {row.Type !== 'Route Stage' && (
                      <input type="checkbox" checked={row.AllowProcurmtDoc === 'Yes'} readOnly />
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="21" className="po-empty">{itemCode ? "No components found for this order." : "\u00A0"}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ProductionOrderComponents;

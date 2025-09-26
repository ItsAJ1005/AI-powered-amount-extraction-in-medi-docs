import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Form,
  InputGroup,
  Button,
  ButtonGroup,
  Badge,
  Pagination,
  Modal,
  Spinner,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import {
  Search,
  Star,
  StarFill,
  Download,
  Trash,
  Clock,
  ArrowClockwise,
  FileEarmarkText,
  FileEarmarkPdf,
  FileEarmarkImage,
  FileEarmarkWord,
  FileEarmarkExcel,
  FileEarmarkPpt,
  FileEarmarkZip,
  FileEarmarkCode,
  FileEarmarkSpreadsheet,
  FileEarmarkExcelFill
} from 'react-bootstrap-icons';

// Local storage keys
const HISTORY_STORAGE_KEY = 'documentHistory';
const FAVORITES_STORAGE_KEY = 'favoriteDocuments';

// Helper functions for local storage
const getFromStorage = (key, defaultValue = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
  }
};

// File type icons mapping
const FILE_ICONS = {
  // Document types
  'application/pdf': <FileEarmarkPdf />,
  'application/msword': <FileEarmarkWord />,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <FileEarmarkWord />,
  'application/vnd.ms-excel': <FileEarmarkExcel />,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': <FileEarmarkExcel />,
  'application/vnd.ms-powerpoint': <FileEarmarkPpt />,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': <FileEarmarkPpt />,
  
  // Image types
  'image/jpeg': <FileEarmarkImage />,
  'image/png': <FileEarmarkImage />,
  'image/gif': <FileEarmarkImage />,
  'image/svg+xml': <FileEarmarkImage />,
  'image/webp': <FileEarmarkImage />,
  
  // Archive types
  'application/zip': <FileEarmarkZip />,
  'application/x-zip-compressed': <FileEarmarkZip />,
  'application/x-rar-compressed': <FileEarmarkZip />,
  'application/x-7z-compressed': <FileEarmarkZip />,
  'application/x-tar': <FileEarmarkZip />,
  'application/gzip': <FileEarmarkZip />,
  'application/x-bzip2': <FileEarmarkZip />,
  'application/x-bzip': <FileEarmarkZip />,
  
  // Text/code types
  'text/plain': <FileEarmarkText />,
  'text/csv': <FileEarmarkSpreadsheet />,
  'text/tab-separated-values': <FileEarmarkSpreadsheet />,
  'application/json': <FileEarmarkCode />,
  'application/xml': <FileEarmarkCode />,
  'text/xml': <FileEarmarkCode />,
  'text/html': <FileEarmarkCode />,
  'text/css': <FileEarmarkCode />,
  'text/javascript': <FileEarmarkCode />,
  'application/javascript': <FileEarmarkCode />,
  'application/typescript': <FileEarmarkCode />,
  'text/x-python': <FileEarmarkCode />,
  'text/x-java-source': <FileEarmarkCode />,
  'text/x-csrc': <FileEarmarkCode />,
  'text/x-c++src': <FileEarmarkCode />,
  'text/x-csharp': <FileEarmarkCode />,
  'text/x-php': <FileEarmarkCode />,
  'text/x-ruby': <FileEarmarkCode />,
  'text/x-go': <FileEarmarkCode />,
  'text/x-swift': <FileEarmarkCode />,
  'text/x-kotlin': <FileEarmarkCode />,
  'text/x-scala': <FileEarmarkCode />,
  'text/x-rust': <FileEarmarkCode />,
  'text/x-dart': <FileEarmarkCode />,
  'text/x-typescript': <FileEarmarkCode />,
  'text/x-sql': <FileEarmarkCode />,
  'text/x-markdown': <FileEarmarkText />,
  'text/markdown': <FileEarmarkText />,
  'text/x-yaml': <FileEarmarkCode />,
  'text/yaml': <FileEarmarkCode />,
  'application/x-yaml': <FileEarmarkCode />,
  'application/yaml': <FileEarmarkCode />,
  'text/x-toml': <FileEarmarkCode />,
  'application/toml': <FileEarmarkCode />,
  'text/x-ini': <FileEarmarkCode />,
  'text/ini': <FileEarmarkCode />,
  'text/x-properties': <FileEarmarkCode />,
  'text/x-sh': <FileEarmarkCode />,
  'application/x-sh': <FileEarmarkCode />,
  'application/x-bash': <FileEarmarkCode />,
  'text/x-powershell': <FileEarmarkCode />,
  'application/x-powershell': <FileEarmarkCode />,
  'text/x-perl': <FileEarmarkCode />,
  'application/x-perl': <FileEarmarkCode />,
  'text/x-lua': <FileEarmarkCode />,
  'application/x-lua': <FileEarmarkCode />,
  'text/x-clojure': <FileEarmarkCode />,
  'application/x-clojure': <FileEarmarkCode />,
  'text/x-haskell': <FileEarmarkCode />,
  'application/x-haskell': <FileEarmarkCode />,
  'text/x-erlang': <FileEarmarkCode />,
  'application/x-erlang': <FileEarmarkCode />,
  'text/x-elixir': <FileEarmarkCode />,
  'application/x-elixir': <FileEarmarkCode />,
  'text/x-julia': <FileEarmarkCode />,
  'application/x-julia': <FileEarmarkCode />,
  'text/x-r': <FileEarmarkCode />,
  'application/x-r': <FileEarmarkCode />,
  'text/x-matlab': <FileEarmarkCode />,
  'application/x-matlab': <FileEarmarkCode />,
  'text/x-objective-c': <FileEarmarkCode />,
  'application/x-objective-c': <FileEarmarkCode />,
  'text/x-objective-c++': <FileEarmarkCode />,
  'application/x-objective-c++': <FileEarmarkCode />,
  'text/x-scala': <FileEarmarkCode />,
  'application/x-scala': <FileEarmarkCode />,
  'text/x-coffeescript': <FileEarmarkCode />,
  'application/x-coffeescript': <FileEarmarkCode />,
  'text/x-livescript': <FileEarmarkCode />,
  'application/x-livescript': <FileEarmarkCode />,
  'text/x-ocaml': <FileEarmarkCode />,
  'application/x-ocaml': <FileEarmarkCode />,
  'text/x-fsharp': <FileEarmarkCode />,
  'application/x-fsharp': <FileEarmarkCode />,
  'text/x-scheme': <FileEarmarkCode />,
  'application/x-scheme': <FileEarmarkCode />,
  'text/x-common-lisp': <FileEarmarkCode />,
  'application/x-common-lisp': <FileEarmarkCode />,
  'text/x-lisp': <FileEarmarkCode />,
  'application/x-lisp': <FileEarmarkCode />,
  'text/x-clisp': <FileEarmarkCode />,
  'application/x-clisp': <FileEarmarkCode />,
  'text/x-scheme': <FileEarmarkCode />,
  'application/x-scheme': <FileEarmarkCode />,
  'text/x-racket': <FileEarmarkCode />,
  'application/x-racket': <FileEarmarkCode />,
  'text/x-common-lisp': <FileEarmarkCode />,
  'application/x-common-lisp': <FileEarmarkCode />
};

const getFileIcon = (fileType) => {
  return FILE_ICONS[fileType] || <FileEarmarkText />;
};

// History item component
const HistoryItem = ({ 
  item, 
  isFavorite, 
  onToggleFavorite, 
  onReprocess, 
  onExport, 
  onDelete,
  onSelect,
  isSelected
}) => {
  const { id, filename, fileType, timestamp, status, metadata = {} } = item;
  const [showDetails, setShowDetails] = useState(false);
  
  const formattedDate = new Date(timestamp).toLocaleString();
  const fileIcon = getFileIcon(fileType);
  
  return (
    <tr className={isSelected ? 'table-active' : ''}>
      <td>
        <Form.Check 
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
        />
      </td>
      <td>
        <Button 
          variant="link" 
          size="sm" 
          className="p-0 me-2"
          onClick={() => onToggleFavorite(id)}
        >
          {isFavorite ? <StarFill className="text-warning" /> : <Star />}
        </Button>
      </td>
      <td onClick={() => setShowDetails(!showDetails)} style={{ cursor: 'pointer' }}>
        <div className="d-flex align-items-center">
          <span className="me-2">{fileIcon}</span>
          <div>
            <div className="fw-medium text-truncate" style={{ maxWidth: '200px' }}>
              {filename || 'Untitled Document'}
            </div>
            <div className="small text-muted">
              {formattedDate}
            </div>
          </div>
        </div>
      </td>
      <td>
        <Badge bg={status === 'completed' ? 'success' : 'warning'}>
          {status}
        </Badge>
      </td>
      <td className="text-end">
        <ButtonGroup size="sm">
          <OverlayTrigger overlay={<Tooltip>Reprocess</Tooltip>}>
            <Button variant="outline-primary" onClick={(e) => {
              e.stopPropagation();
              onReprocess(item);
            }}>
              <ArrowClockwise />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger overlay={<Tooltip>Export</Tooltip>}>
            <Button variant="outline-success" onClick={(e) => {
              e.stopPropagation();
              onExport([item]);
            }}>
              <Download />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger overlay={<Tooltip>Delete</Tooltip>}>
            <Button variant="outline-danger" onClick={(e) => {
              e.stopPropagation();
              onDelete([id]);
            }}>
              <Trash />
            </Button>
          </OverlayTrigger>
        </ButtonGroup>
      </td>
    </tr>
  );
};

// Main HistoryPanel component
const HistoryPanel = ({ onReprocess, className = '' }) => {
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'favorites', 'recent'
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const itemsPerPage = 10;
  
  // Load history and favorites from localStorage
  useEffect(() => {
    try {
      const savedHistory = getFromStorage(HISTORY_STORAGE_KEY);
      const savedFavorites = new Set(getFromStorage(FAVORITES_STORAGE_KEY, []));
      
      setHistory(savedHistory);
      setFavorites(savedFavorites);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading history:', error);
      setIsLoading(false);
    }
  }, []);
  
  // Save to localStorage when history or favorites change
  useEffect(() => {
    if (!isLoading) {
      saveToStorage(HISTORY_STORAGE_KEY, history);
    }
  }, [history, isLoading]);
  
  useEffect(() => {
    if (!isLoading) {
      saveToStorage(FAVORITES_STORAGE_KEY, Array.from(favorites));
    }
  }, [favorites, isLoading]);
  
  // Add a new item to history
  const addToHistory = (item) => {
    const newItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: 'completed',
      ...item
    };
    
    setHistory(prev => [newItem, ...prev]);
    return newItem;
  };
  
  // Toggle favorite status
  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };
  
  // Delete items from history
  const deleteItems = (ids) => {
    setHistory(prev => prev.filter(item => !ids.includes(item.id)));
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      ids.forEach(id => newSelected.delete(id));
      return newSelected;
    });
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      ids.forEach(id => newFavorites.delete(id));
      return newFavorites;
    });
  };
  
  // Export items as JSON
  const exportItems = (items) => {
    const data = Array.isArray(items) ? items : 
      history.filter(item => selectedItems.has(item.id));
    
    if (data.length === 0) return;
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportName = `history_export_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  };
  
  // Filter and sort history
  const filteredHistory = history
    .filter(item => {
      const matchesSearch = item.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.metadata?.text?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isFavorite = favorites.has(item.id);
      
      if (filter === 'favorites') return matchesSearch && isFavorite;
      if (filter === 'recent') return matchesSearch && item.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      return matchesSearch;
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedItems = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle select/deselect all
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(new Set(paginatedItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };
  
  // Handle individual item selection
  const toggleSelectItem = (id, isSelected) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (isSelected) {
        newSelected.add(id);
      } else {
        newSelected.delete(id);
      }
      return newSelected;
    });
  };
  
  // Handle bulk delete confirmation
  const confirmDelete = (ids) => {
    setItemsToDelete(Array.isArray(ids) ? ids : Array.from(selectedItems));
    setShowDeleteConfirm(true);
  };
  
  // Handle actual deletion
  const handleDeleteConfirmed = () => {
    deleteItems(itemsToDelete);
    setShowDeleteConfirm(false);
  };
  
  return (
    <Card className={className}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <h5 className="mb-0 me-3">Document History</h5>
          <ButtonGroup size="sm" className="me-2">
            <Button 
              variant={filter === 'all' ? 'primary' : 'outline-secondary'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={filter === 'favorites' ? 'primary' : 'outline-secondary'}
              onClick={() => setFilter('favorites')}
            >
              <StarFill className="text-warning" /> Favorites
            </Button>
            <Button 
              variant={filter === 'recent' ? 'primary' : 'outline-secondary'}
              onClick={() => setFilter('recent')}
            >
              <Clock /> Recent
            </Button>
          </ButtonGroup>
        </div>
        
        <div className="d-flex">
          <InputGroup size="sm" style={{ width: '250px' }}>
            <Form.Control
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline-secondary">
              <Search />
            </Button>
          </InputGroup>
        </div>
      </Card.Header>
      
      <Card.Body>
        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <div className="mt-2">Loading history...</div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-4 text-muted">
            No history items found
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <Form.Check
                        type="checkbox"
                        checked={selectedItems.size === paginatedItems.length && paginatedItems.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th style={{ width: '40px' }}></th>
                    <th>Document</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map(item => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      isFavorite={favorites.has(item.id)}
                      onToggleFavorite={toggleFavorite}
                      onReprocess={onReprocess}
                      onExport={exportItems}
                      onDelete={confirmDelete}
                      onSelect={toggleSelectItem}
                      isSelected={selectedItems.has(item.id)}
                    />
                  ))}
                </tbody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted small">
                  Showing {paginatedItems.length} of {filteredHistory.length} items
                </div>
                <Pagination className="mb-0">
                  <Pagination.Prev 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  />
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5 || currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Pagination.Item
                        key={pageNum}
                        active={pageNum === currentPage}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Pagination.Item>
                    );
                  })}
                  <Pagination.Next 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  />
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card.Body>
      
      <Card.Footer className="d-flex justify-content-between align-items-center">
        <div>
          {selectedItems.size > 0 && (
            <span className="text-muted small">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
        
        <div>
          {selectedItems.size > 0 && (
            <>
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="me-2"
                onClick={() => exportItems()}
                disabled={selectedItems.size === 0}
              >
                <Download className="me-1" /> Export Selected
              </Button>
              
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={() => confirmDelete()}
                disabled={selectedItems.size === 0}
              >
                <Trash className="me-1" /> Delete Selected
              </Button>
            </>
          )}
        </div>
      </Card.Footer>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete {itemsToDelete.length} item{itemsToDelete.length !== 1 ? 's' : ''}? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirmed}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default HistoryPanel;

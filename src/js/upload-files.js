const registerUploadFilesModal = ({ emulator }) => {
  const uploadButton = document.getElementById('upload-button');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseButton = document.getElementById('modal-close-button');
  const selectFileButton = document.getElementById('select-file-button');
  const fileInput = document.getElementById('file-input');
  const selectedFilenameSpan = document.getElementById('selected-filename');

  const openModal = () => {
    if (modalOverlay) {
      modalOverlay.classList.add('modal-visible');
    }
  };

  const closeModal = () => {
    if (modalOverlay) {
      modalOverlay.classList.remove('modal-visible');
      if (selectedFilenameSpan) {
        selectedFilenameSpan.textContent = 'No file selected';
      }
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  if (uploadButton) {
    uploadButton.addEventListener('click', openModal);
  }

  if (modalCloseButton) {
    modalCloseButton.addEventListener('click', closeModal);
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (event) => {
      if (event.target === modalOverlay) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      modalOverlay &&
      modalOverlay.classList.contains('modal-visible')
    ) {
      closeModal();
    }
  });

  if (selectFileButton && fileInput) {
    selectFileButton.addEventListener('click', () => {
      fileInput.click();
    });
  }

  if (fileInput && selectedFilenameSpan) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        selectFileButton.textContent = Array.from(fileInput.files).reduce(
          (acc, file, i) => {
            const separator = i === 0 ? '' : ', ';
            return `${separator}${file.name}`;
          },
        );
        Array.from(fileInput.files).forEach((_file) => {
          const reader = new FileReader();
          const path = `/${_file.name}`;
          reader.onload = (f) => {
            const data = new Uint8Array(f.target.result);
            return emulator.create_file(path, data);
          };
          reader.readAsArrayBuffer(_file);
        });
      } else {
        selectedFilenameSpan.textContent = 'No file selected';
      }
      closeModal();
    });
  }
};

export default registerUploadFilesModal;

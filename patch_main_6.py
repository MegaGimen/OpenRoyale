with open("src/main.ts", "r") as f:
    lines = f.readlines()

replacement = """async function loadMappings() {
    const loadingUI = document.createElement('div');
    loadingUI.id = 'loading-ui';
    loadingUI.style.position = 'absolute';
    loadingUI.style.top = '0';
    loadingUI.style.left = '0';
    loadingUI.style.width = '100%';
    loadingUI.style.height = '100%';
    loadingUI.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    loadingUI.style.color = '#fff';
    loadingUI.style.display = 'flex';
    loadingUI.style.flexDirection = 'column';
    loadingUI.style.alignItems = 'center';
    loadingUI.style.justifyContent = 'center';
    loadingUI.style.fontSize = '24px';
    loadingUI.style.zIndex = '9999';
    loadingUI.style.fontFamily = 'monospace';
    
    const textDiv = document.createElement('div');
    textDiv.innerText = 'Preloading Assets...';
    
    const progressContainer = document.createElement('div');
    progressContainer.style.width = '300px';
    progressContainer.style.height = '20px';
    progressContainer.style.border = '2px solid white';
    progressContainer.style.marginTop = '10px';
    
    const progressBar = document.createElement('div');
    progressBar.style.width = '0%';
    progressBar.style.height = '100%';
    progressBar.style.backgroundColor = 'white';
    progressBar.style.transition = 'width 0.2s';
    
    progressContainer.appendChild(progressBar);
    loadingUI.appendChild(textDiv);
    loadingUI.appendChild(progressContainer);
    document.body.appendChild(loadingUI);

    const chars = ['chr_knight', 'chr_archer', 'chr_giant', 'chr_pekka', 'chr_minion', 'chr_skeleton', 'chr_barbarian', 'chr_musketeer', 'chr_hog_rider', 'chr_wizard', 'building_tower', 'effects'];
    let loaded = 0;
    
    const isCached = localStorage.getItem('sc_assets_cached') === 'true';
    if (isCached) {
        loadingUI.style.display = 'none';
        Promise.all(chars.map(c => SCRenderer.loadCharacter(c)));
        return;
    }

    for (const c of chars) {
        await SCRenderer.loadCharacter(c);
        loaded++;
        const p = Math.floor((loaded / chars.length) * 100);
        textDiv.innerText = `Preloading Asset Data: ${loaded} / ${chars.length}`;
        progressBar.style.width = `${p}%`;
    }
    
    localStorage.setItem('sc_assets_cached', 'true');
    loadingUI.style.display = 'none';
}
"""

new_lines = []
in_load = False
for line in lines:
    if line.startswith('async function loadMappings() {'):
        in_load = True
        new_lines.append(replacement)
    elif in_load and line.strip() == '}':
        in_load = False
    elif not in_load:
        new_lines.append(line)

with open("src/main.ts", "w") as f:
    f.writelines(new_lines)
